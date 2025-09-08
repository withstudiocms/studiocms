import { existsSync, promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cancelled, success } from '@withstudiocms/cli-kit/messages';
import { exists, pathToFileURL, resolveRoot } from '@withstudiocms/cli-kit/utils';
import { intro, note, outro } from '@withstudiocms/effect/clack';
import { type ASTNode, builders, loadFile, type ProxifiedModule } from 'magicast';
import { getDefaultExportOptions } from 'magicast/helpers';
import { Cli, Console, Effect, genLogger, Layer } from '../../effect.js';
import { CliContext, genContext } from '../utils/context.js';
import { logger } from '../utils/logger.js';
import { TryToInstallPlugins } from './tryToInstallPlugins.js';
import { UpdateStudioCMSConfig } from './updateStudioCMSConfig.js';
import { ValidatePlugins } from './validatePlugins.js';

export const ALIASES = new Map([
	['auth0', '@studiocms/auth0'],
	['blog', '@studiocms/blog'],
	['cloudinary', '@studiocms/cloudinary-image-service'],
	['discord', '@studiocms/discord'],
	['github', '@studiocms/github'],
	['google', '@studiocms/google'],
	['html', '@studiocms/html'],
	['markdoc', '@studiocms/markdoc'],
	['md', '@studiocms/md'],
	['mdx', '@studiocms/mdx'],
	['wysiwyg', '@studiocms/wysiwyg'],
]);

export const StudioCMSScopes = ['@studiocms', '@withstudiocms'];

export interface PluginInfo {
	id: string;
	packageName: string;
	pluginName: string;
	dependencies: [name: string, version: string][];
}

// biome-ignore lint/style/useEnumInitializers: We want the natural number progression for UpdateResult
// biome-ignore lint/suspicious/noConstEnum: Using const enum for better runtime performance
export const enum UpdateResult {
	none,
	updated,
	cancelled,
	failure,
}

export const STUBS = {
	STUDIOCMS_CONFIG: `import { defineStudioCMSConfig } from 'studiocms/config';\n\nexport default defineStudioCMSConfig({\n\tdbStartPage: false,\n});`,
};

export const toIdent = (name: string) => {
	const ident = name
		.trim()
		// Remove studiocms prefix and suffix (e.g., studiocms-plugin, studiocms.plugin)
		.replace(/[-_./]?studiocms?[-_.]?/g, '')
		// drop .js suffix
		.replace(/\.js/, '')
		// convert to camel case
		.replace(/[.\-_/]+([a-zA-Z])/g, (_, w) => w.toUpperCase())
		// drop invalid first characters
		.replace(/^[^a-zA-Z$_]+/, '')
		// drop version or tag
		.replace(/@.*$/, '');
	return `${ident[0].toLowerCase()}${ident.slice(1)}`;
};

export const createPrettyError = (err: Error) =>
	Effect.sync(() => {
		err.message = `StudioCMS could not update your studiocms.config.mjs file safely.
	Reason: ${err.message}
	
	You will need to add these plugins(s) manually.
	Documentation: https://docs.studiocms.dev`;
		return err;
	});

/**
 * Paths to search for the StudioCMS config file,
 * sorted by how likely they're to appear.
 */
const configPaths = Object.freeze([
	'./studiocms.config.js',
	'./studiocms.config.mjs',
	'./studiocms.config.cjs',
	'./studiocms.config.ts',
	'./studiocms.config.mts',
	'./studiocms.config.cts',
]);

export const resolveConfigPath = (root: URL) =>
	genLogger('studiocms/cli/add.resolveConfigPath')(function* () {
		for (const path of configPaths) {
			const url = yield* Effect.try(() => new URL(path, root));
			if (exists(url)) return url;
		}
		yield* Console.error(
			`No StudioCMS config file found in ${root.toString()}. Searched for: ${configPaths.join(', ')}`
		);
		return undefined;
	});

export function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : `${path}/`;
}

export const plugin = Cli.Args.text({ name: 'plugin' }).pipe(
	Cli.Args.withDescription(' name of the plugin to add'),
	Cli.Args.repeated
);

const resolveOrCreateConfig = (root: URL) =>
	genLogger('studiocms/cli/add.resolveOrCreateConfig')(function* () {
		const existingConfig = yield* resolveConfigPath(root);
		if (existingConfig) return existingConfig;

		yield* Console.debug('Unable to locate a config file, generating one for you.');
		const newConfigURL = new URL('./studiocms.config.mjs', root);
		yield* Effect.tryPromise(() =>
			fs.writeFile(fileURLToPath(newConfigURL), STUBS.STUDIOCMS_CONFIG, {
				encoding: 'utf-8',
			})
		);
		return newConfigURL;
	});

const loadConfigModule = (configURL: URL, validatedPlugins: PluginInfo[]) =>
	genLogger('studiocms/cli/add.loadConfigModule')(function* () {
		// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any
		let mod: ProxifiedModule<any> | undefined;

		mod = yield* Effect.tryPromise(() => loadFile(fileURLToPath(configURL)));
		yield* Console.debug('Parsed StudioCMS Config');

		if (mod.exports.default.$type !== 'function-call') {
			// ensure config is wrapped with "defineStudioCMSConfig"
			mod.imports.$prepend({ imported: 'defineStudioCMSConfig', from: 'studiocms/config' });
			mod.exports.default = builders.functionCall('defineStudioCMSConfig', mod.exports.default);
		} else if (mod.exports.default.$args[0] == null) {
			// ensure first argument of "defineStudioCMSConfig" is not empty
			mod.exports.default.$args[0] = { dbStartPage: false };
		}

		yield* Console.debug('StudioCMS config ensured `defineStudioCMSConfig`');

		for (const plugin of validatedPlugins) {
			const config = getDefaultExportOptions(mod);
			const pluginId = toIdent(plugin.id);

			if (!mod.imports.$items.some((imp) => imp.local === pluginId)) {
				mod.imports.$append({
					imported: 'default',
					local: pluginId,
					from: plugin.packageName,
				});
			}

			config.plugins ??= [];
			if (
				!config.plugins.$ast.elements.some(
					(el: ASTNode) =>
						el.type === 'CallExpression' &&
						el.callee.type === 'Identifier' &&
						el.callee.name === pluginId
				)
			) {
				config.plugins.push(builders.functionCall(pluginId));
			}
			yield* Console.debug(`StudioCMS config added plugin ${plugin.id}`);
		}

		return mod;
	});

const addPluginDeps = Layer.mergeAll(
	ValidatePlugins.Default,
	TryToInstallPlugins.Default,
	UpdateStudioCMSConfig.Default
);

export const addPlugin = Cli.Command.make(
	'add',
	{
		plugin,
	},
	({ plugin }) =>
		Effect.gen(function* () {
			const [validator, installer, updater, context] = yield* Effect.all([
				ValidatePlugins,
				TryToInstallPlugins,
				UpdateStudioCMSConfig,
				genContext,
			]);

			const { cwd, chalk } = context;

			yield* intro('StudioCMS CLI Utilities (add)');

			const pluginNames = plugin.map((name) => {
				const aliasName = ALIASES.get(name);
				if (!aliasName) return name;
				return aliasName;
			});

			const validatedPlugins = yield* validator
				.run(pluginNames)
				.pipe(CliContext.makeProvide(context));

			const installResult: UpdateResult = yield* installer
				.run(validatedPlugins)
				.pipe(CliContext.makeProvide(context));

			const rootPath = resolveRoot(cwd);
			const root = pathToFileURL(rootPath);
			// Append forward slash to compute relative paths
			root.href = appendForwardSlash(root.href);

			switch (installResult) {
				case UpdateResult.updated: {
					break;
				}
				case UpdateResult.cancelled: {
					yield* note(
						cancelled(
							`Dependencies ${chalk.bold('NOT')} installed.`,
							'Be sure to install them manually before continuing!'
						)
					);
					break;
				}
				case UpdateResult.failure: {
					throw createPrettyError(new Error('Unable to install dependencies'));
				}
				case UpdateResult.none:
					break;
			}

			const configURL = yield* resolveOrCreateConfig(new URL(rootPath));

			yield* Console.debug(`found config at ${configURL}`);

			const mod = yield* loadConfigModule(configURL, validatedPlugins);

			let configResult: UpdateResult | undefined;

			if (mod) {
				configResult = yield* updater.run(configURL, mod).pipe(
					CliContext.makeProvide(context),
					Effect.catchAll((err) => {
						logger.debug(`Error updating studiocms config ${err}`);
						return Effect.fail(createPrettyError(err as Error));
					})
				);
			}

			switch (configResult) {
				case UpdateResult.cancelled: {
					yield* outro(cancelled(`Your configuration has ${chalk.bold('NOT')} been updated.`));
					break;
				}
				case UpdateResult.none: {
					const pkgURL = new URL('./package.json', configURL);
					if (existsSync(fileURLToPath(pkgURL))) {
						const { dependencies = {}, devDependencies = {} } = yield* Effect.tryPromise(() =>
							fs.readFile(fileURLToPath(pkgURL)).then((res) => JSON.parse(res.toString()))
						);
						const deps = Object.keys(Object.assign(dependencies, devDependencies));
						const missingDeps = validatedPlugins.filter(
							(plugin) => !deps.includes(plugin.packageName)
						);
						if (missingDeps.length === 0) {
							yield* outro('Configuration up-to-date.');
							break;
						}
					}

					yield* outro('Configuration up-to-date.');
					break;
				}
				// NOTE: failure shouldn't happen in practice because `updateAstroConfig` doesn't return that.
				// Pipe this to the same handling as `UpdateResult.updated` for now.
				case UpdateResult.failure:
				case UpdateResult.updated:
				case undefined: {
					const list = validatedPlugins.map((plugin) => `  - ${plugin.pluginName}`).join('\n');

					yield* outro(
						success(
							`Added the following plugin${validatedPlugins.length === 1 ? '' : 's'} to your project:\n ${list}`
						)
					);
				}
			}
		}).pipe(Effect.provide(addPluginDeps))
).pipe(Cli.Command.withDescription('Add StudioCMS plugin(s) to your project'));
