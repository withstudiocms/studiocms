import { promises as fs, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Option } from '@commander-js/extra-typings';
import color from 'chalk';
import { type ASTNode, type ProxifiedModule, builders, loadFile } from 'magicast';
import { getDefaultExportOptions } from 'magicast/helpers';
import { Command } from '../lib/commander.js';
import { getContext } from '../lib/context.js';
import { applyPolyfill } from '../lib/polyfill.js';
import { resolveRoot } from '../lib/resolveRoot.js';
import { tryToInstallPlugins } from './add/tryToInstallPlugins.js';
import { updateStudioCMSConfig } from './add/updateStudioCMSConfig.js';
import {
	ALIASES,
	type Logger,
	STUBS,
	UpdateResult,
	appendForwardSlash,
	cancelled,
	createPrettyError,
	pathToFileURL,
	resolveConfigPath,
	success,
	toIdent,
} from './add/utils.js';
import { validatePlugins } from './add/validatePlugins.js';

await new Command('add')
	.description('Add a StudioCMS Plugin to your project')
	.summary('Add a StudioCMS Plugin to your project')
	.argument('<plugins...>', 'Plugin to install')
	.option('-d, --dry-run', 'Dry run mode.')
	.addOption(new Option('--debug', 'Enable debug mode.').hideHelp(true))
	.action(async (plugins, opts) => {
		applyPolyfill();

		const context = await getContext(opts);

		const cwd = context.cwd;
		const isDebugMode = context.debug || false;
		const logger: Logger = {
			...context.logger,
			debug: (message: string) => {
				if (isDebugMode) context.logger.debug(message);
			},
		};

		const pluginNames = plugins.map((name) =>
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			ALIASES.has(name) ? ALIASES.get(name)! : name
		);

		const validatedPlugins = await validatePlugins(pluginNames);
		const installResult = await tryToInstallPlugins({
			plugins: validatedPlugins,
			cwd,
			logger,
		});
		const rootPath = resolveRoot(cwd);
		const root = pathToFileURL(rootPath);
		// Append forward slash to compute relative paths
		root.href = appendForwardSlash(root.href);

		switch (installResult) {
			case UpdateResult.updated: {
				break;
			}
			case UpdateResult.cancelled: {
				logger.log(
					cancelled(
						`Dependencies ${color.bold('NOT')} installed.`,
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

		let configURL = await resolveConfigPath(new URL(rootPath));

		if (configURL) {
			logger.debug(`found config at ${configURL}`);
		} else {
			logger.debug('Unable to locate a config file, generating one for you.');
			configURL = new URL('./studiocms.config.mjs', root);
			await fs.writeFile(fileURLToPath(configURL), STUBS.STUDIOCMS_CONFIG, {
				encoding: 'utf-8',
			});
		}

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let mod: ProxifiedModule<any> | undefined;
		try {
			mod = await loadFile(fileURLToPath(configURL));
			logger.debug('Parsed StudioCMS Config');

			if (mod.exports.default.$type !== 'function-call') {
				// ensure config is wrapped with "defineStudioCMSConfig"
				mod.imports.$prepend({ imported: 'defineStudioCMSConfig', from: 'studiocms/config' });
				mod.exports.default = builders.functionCall('defineStudioCMSConfig', mod.exports.default);
			} else if (mod.exports.default.$args[0] == null) {
				// ensure first argument of "defineStudioCMSConfig" is not empty
				mod.exports.default.$args[0] = { dbStartPage: false };
			}
			logger.debug('StudioCMS config ensured `defineStudioCMSConfig`');

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
				logger.debug(`StudioCMS config added plugin ${plugin.id}`);
			}
		} catch (err) {
			logger.debug(`Error parsing/modifying astro config: ${err}`);
			throw createPrettyError(err as Error);
		}

		let configResult: UpdateResult | undefined;

		if (mod) {
			try {
				configResult = await updateStudioCMSConfig({
					configURL,
					mod,
					logger,
				});
			} catch (err) {
				logger.debug(`Error updating studiocms config ${err}`);
				throw createPrettyError(err as Error);
			}
		}

		switch (configResult) {
			case UpdateResult.cancelled: {
				logger.log(cancelled(`Your configuration has ${color.bold('NOT')} been updated.`));
				break;
			}
			case UpdateResult.none: {
				const pkgURL = new URL('./package.json', configURL);
				if (existsSync(fileURLToPath(pkgURL))) {
					const { dependencies = {}, devDependencies = {} } = await fs
						.readFile(fileURLToPath(pkgURL))
						.then((res) => JSON.parse(res.toString()));
					const deps = Object.keys(Object.assign(dependencies, devDependencies));
					const missingDeps = validatedPlugins.filter(
						(plugin) => !deps.includes(plugin.packageName)
					);
					if (missingDeps.length === 0) {
						logger.log('Configuration up-to-date.');
						break;
					}
				}

				logger.log('Configuration up-to-date.');
				break;
			}
			// NOTE: failure shouldn't happen in practice because `updateAstroConfig` doesn't return that.
			// Pipe this to the same handling as `UpdateResult.updated` for now.
			case UpdateResult.failure:
			case UpdateResult.updated:
			case undefined: {
				const list = validatedPlugins.map((plugin) => `  - ${plugin.pluginName}`).join('\n');

				logger.log(
					success(
						`Added the following plugin${validatedPlugins.length === 1 ? '' : 's'} to your project:\n ${list}`
					)
				);
			}
		}
	})
	.parseAsync();
