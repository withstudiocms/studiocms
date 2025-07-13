import { promises as fs, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Args, Command } from '@effect/cli';
import { cancelled, success } from '@withstudiocms/cli-kit/messages';
import { exists, pathToFileURL, resolveRoot } from '@withstudiocms/cli-kit/utils';
import { type ASTNode, type ProxifiedModule, builders, loadFile } from 'magicast';
import { getDefaultExportOptions } from 'magicast/helpers';
import { Console, Effect, genLogger } from '../../effect.js';
import { CliContext, genContext } from '../utils/context.js';
import { TryToInstallPlugins } from './tryToInstallPlugins.js';
import { UpdateStudioCMSConfig } from './updateStudioCMSConfig.js';
import { ValidatePlugins } from './validatePlugins.js';

export const ALIASES = new Map([
	['blog', '@studiocms/blog'],
	['mdx', '@studiocms/mdx'],
	['markdoc', '@studiocms/markdoc'],
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
	Effect.try(() => {
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

export const plugin = Args.text({ name: 'plugin' }).pipe(
	Args.withDescription('The name of the ship'),
	Args.repeated
);

export const addPlugin = Command.make(
	'add',
	{
		plugin,
	},
	({ plugin }) =>
		Effect.gen(function* () {
			const validator = yield* ValidatePlugins;
			const installer = yield* TryToInstallPlugins;
			const updater = yield* UpdateStudioCMSConfig;

			const context = yield* genContext;

			const { cwd, prompts, chalk } = context;

			prompts.intro('StudioCMS CLI Utilities (add)');

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
					prompts.note(
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

			let configURL: URL | undefined;

			const existingConfig = yield* resolveConfigPath(new URL(rootPath));

			if (existingConfig) {
				configURL = yield* resolveConfigPath(new URL(rootPath));
			}

			if (!configURL) {
				yield* Console.debug('Unable to locate a config file, generating one for you.');
				const newConfigURL = new URL('./studiocms.config.mjs', root);
				yield* Effect.tryPromise(() =>
					fs.writeFile(fileURLToPath(newConfigURL), STUBS.STUDIOCMS_CONFIG, {
						encoding: 'utf-8',
					})
				);

				configURL = newConfigURL;
			}

			yield* Console.debug(`found config at ${configURL}`);

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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

			let configResult: UpdateResult | undefined;

			if (mod) {
				try {
					configResult = yield* updater.run(configURL, mod).pipe(CliContext.makeProvide(context));
				} catch (err) {
					yield* Console.debug(`Error updating studiocms config ${err}`);
					throw createPrettyError(err as Error);
				}
			}

			switch (configResult) {
				case UpdateResult.cancelled: {
					prompts.outro(cancelled(`Your configuration has ${chalk.bold('NOT')} been updated.`));
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
							prompts.outro('Configuration up-to-date.');
							break;
						}
					}

					prompts.outro('Configuration up-to-date.');
					break;
				}
				// NOTE: failure shouldn't happen in practice because `updateAstroConfig` doesn't return that.
				// Pipe this to the same handling as `UpdateResult.updated` for now.
				case UpdateResult.failure:
				case UpdateResult.updated:
				case undefined: {
					const list = validatedPlugins.map((plugin) => `  - ${plugin.pluginName}`).join('\n');

					prompts.outro(
						success(
							`Added the following plugin${validatedPlugins.length === 1 ? '' : 's'} to your project:\n ${list}`
						)
					);
				}
			}
		}).pipe(
			Effect.provide(ValidatePlugins.Default),
			Effect.provide(TryToInstallPlugins.Default),
			Effect.provide(UpdateStudioCMSConfig.Default)
		)
);
