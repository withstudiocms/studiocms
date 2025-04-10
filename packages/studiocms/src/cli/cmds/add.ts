import fsMod, { existsSync, promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import { Option } from '@commander-js/extra-typings';
import boxen from 'boxen';
import color from 'chalk';
import { diffWords } from 'diff';
import { type ASTNode, type ProxifiedModule, builders, generateCode, loadFile } from 'magicast';
import { getDefaultExportOptions } from 'magicast/helpers';
import { detect, resolveCommand } from 'package-manager-detector';
import maxSatisfying from 'semver/ranges/max-satisfying.js';
import yoctoSpinner from 'yocto-spinner';
import { Command } from '../lib/commander.js';
import { getContext } from '../lib/context.js';
import { exec } from '../lib/exec.js';
import { applyPolyfill } from '../lib/polyfill.js';
import { resolveRoot } from '../lib/resolveRoot.js';

const ALIASES = new Map([
	['blog', '@studiocms/blog'],
	['mdx', '@studiocms/mdx'],
	['markdoc', '@studiocms/markdoc'],
]);

const StudioCMSScopes = ['@studiocms', '@withstudiocms'];

interface PluginInfo {
	id: string;
	packageName: string;
	pluginName: string;
	dependencies: [name: string, version: string][];
}

interface Logger {
	log: (message: string) => void;
	debug: (message: string) => void;
	error: (message: string) => void;
	warn: (message: string) => void;
}

// biome-ignore lint/style/useEnumInitializers: <explanation>
// biome-ignore lint/suspicious/noConstEnum: <explanation>
const enum UpdateResult {
	none,
	updated,
	cancelled,
	failure,
}

const STUBS = {
	STUDIOCMS_CONFIG: `import { defineStudioCMSConfig } from 'studiocms/config';\n\nexport default defineStudioCMSConfig({\n\tdbStartPage: false,\n});`,
};

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
		const logger = context.logger;

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
				addPlugin(mod, plugin);
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

async function updateStudioCMSConfig({
	configURL,
	logger,
	mod,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
}: { configURL: URL; mod: ProxifiedModule<any>; logger: Logger }): Promise<UpdateResult> {
	const input = await fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' });
	const output = generateCode(mod, {
		format: {
			objectCurlySpacing: true,
			useTabs: false,
			tabWidth: 2,
		},
	}).code;

	if (input === output) return UpdateResult.none;

	const diff = getDiffContent(input, output);

	if (!diff) return UpdateResult.none;

	const message = `\n${boxen(diff, {
		margin: 0.5,
		padding: 0.5,
		borderStyle: 'round',
		title: configURL.pathname.split('/').pop(),
	})}\n`;

	logger.log(
		`\n ${color.magenta('StudioCMS will make the following changes to your config file:')}\n${message}`
	);

	if (await askToContinue()) {
		await fs.writeFile(fileURLToPath(configURL), output, { encoding: 'utf-8' });
		logger.debug('Updated studiocms config');
		return UpdateResult.updated;
	}
	return UpdateResult.cancelled;
}

function getDiffContent(input: string, output: string): string | null {
	const changes = [];
	for (const change of diffWords(input, output)) {
		const lines = change.value.trim().split('\n').slice(0, change.count);
		if (lines.length === 0) continue;
		if (change.added) {
			if (!change.value.trim()) continue;
			changes.push(change.value);
		}
	}
	if (changes.length === 0) {
		return null;
	}

	let diffed = output;
	for (const newContent of changes) {
		const coloredOutput = newContent
			.split('\n')
			.map((ln) => (ln ? color.green(ln) : ''))
			.join('\n');
		diffed = diffed.replace(newContent, coloredOutput);
	}

	return diffed;
}

const toIdent = (name: string) => {
	const ident = name
		.trim()
		// Remove astro or (astrojs) prefix and suffix
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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function addPlugin(mod: ProxifiedModule<any>, plugin: PluginInfo) {
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
}

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

async function resolveConfigPath(root: URL): Promise<URL | undefined> {
	for (const path of configPaths) {
		const configUrl = new URL(path, root);
		if (exists(configUrl)) return configUrl;
	}
	return undefined;
}

function exists(path: URL | string | undefined) {
	if (!path) return false;
	try {
		fsMod.statSync(path);
		return true;
	} catch {
		return false;
	}
}

function createPrettyError(err: Error) {
	err.message = `StudioCMS could not update your studiocms.config.mjs file safely.
	Reason: ${err.message}
	
	You will need to add these plugins(s) manually.
	Documentation: https://docs.studiocms.dev`;
	return err;
}

export function cancelled(message: string, tip?: string) {
	const badge = color.bgYellow(color.black(' cancelled '));
	const headline = color.yellow(message);
	const footer = tip ? `\n  ▶ ${tip}` : undefined;
	return ['', `${badge} ${headline}`, footer]
		.filter((v) => v !== undefined)
		.map((msg) => `  ${msg}`)
		.join('\n');
}

function success(message: string, tip?: string) {
	const badge = color.bgGreen(color.black(' success '));
	const headline = color.green(message);
	const footer = tip ? `\n  ▶ ${tip}` : undefined;
	return ['', `${badge} ${headline}`, footer]
		.filter((v) => v !== undefined)
		.map((msg) => `  ${msg}`)
		.join('\n');
}

async function tryToInstallPlugins({
	plugins,
	cwd,
	logger,
}: {
	plugins: PluginInfo[];
	cwd?: string;
	logger: Logger;
}): Promise<UpdateResult> {
	const packageManager = await detect({
		cwd,
		// Include the `install-metadata` strategy to have the package manager that's
		// used for installation take precedence
		strategies: ['install-metadata', 'lockfile', 'packageManager-field'],
	});
	logger.debug(`[add]: package manager: '${packageManager?.name}'`);
	if (!packageManager) return UpdateResult.none;

	const installCommand = resolveCommand(packageManager?.agent ?? 'npm', 'add', []);
	if (!installCommand) return UpdateResult.none;

	const installSpecifiers = await convertIntegrationsToInstallSpecifiers(plugins).then(
		(specifiers) =>
			installCommand.command === 'deno'
				? specifiers.map((specifier) => `npm:${specifier}`) // Deno requires npm prefix to install packages
				: specifiers
	);

	const coloredOutput = `${color.bold(installCommand.command)} ${installCommand.args.join(' ')} ${color.magenta(installSpecifiers.join(' '))}`;

	const message = `\n${boxen(coloredOutput, {
		margin: 0.5,
		padding: 0.5,
		borderStyle: 'round',
	})}\n`;

	logger.log(
		`${color.magenta('StudioCMS will run the following command:')}\n ${color.dim('If you skip this step, you can always run it yourself later')}\n${message}`
	);

	if (await askToContinue()) {
		const spinner = yoctoSpinner({
			text: 'Installing dependencies...',
		}).start();
		try {
			await exec(installCommand.command, [...installCommand.args, ...installSpecifiers], {
				nodeOptions: {
					cwd,
					env: { NODE_ENV: undefined },
				},
			});
			spinner.success();
			return UpdateResult.updated;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (err: any) {
			spinner.error();
			logger.debug(`[add]: Error installing dependencies ${err}`);
			// NOTE: `err.stdout` can be an empty string, so log the full error instead for a more helpful log
			console.error('\n', err.stdout || err.message, '\n');
			return UpdateResult.failure;
		}
	} else {
		return UpdateResult.cancelled;
	}
}

async function validatePlugins(names: string[]): Promise<PluginInfo[]> {
	const spinner = yoctoSpinner({ text: 'Resolving packages...' }).start();
	try {
		const pluginEntries = await Promise.all(
			names.map(async (plugin): Promise<PluginInfo> => {
				const parsed = parsePluginName(plugin);
				if (!parsed) {
					throw new Error(`${color.bold(plugin)} does not appear to be a valid package name!`);
				}
				const { scope, name, tag } = parsed;
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				let pkgJson: any = {};
				let pkgType: 'first-party' | 'third-party';

				if (scope && !StudioCMSScopes.includes(scope)) {
					pkgType = 'third-party';
				} else {
					const firstPartyPkgCheck = await fetchPackageJson(scope, name, tag);
					if (firstPartyPkgCheck instanceof Error) {
						if (firstPartyPkgCheck.message) {
							spinner.warning(color.yellow(firstPartyPkgCheck.message));
						}
						spinner.warning(
							color.yellow(`${color.bold(plugin)} is not an official StudioCMS package.`)
						);
						if (!(await askToContinue())) {
							throw new Error(
								`No problem! Find our official plugins at ${color.magenta('https://docs.studiocms.dev')}`
							);
						}
						spinner.start('Resolving with third party packages...');
						pkgType = 'third-party';
					} else {
						pkgType = 'first-party';
						// biome-ignore lint/suspicious/noExplicitAny: <explanation>
						pkgJson = firstPartyPkgCheck as any;
					}
				}

				if (pkgType === 'third-party') {
					const thirdPartyPkgCheck = await fetchPackageJson(scope, name, tag);
					if (thirdPartyPkgCheck instanceof Error) {
						if (thirdPartyPkgCheck.message) {
							spinner.warning(color.yellow(thirdPartyPkgCheck.message));
						}
						throw new Error(`Unable to fetch ${color.bold(plugin)}. Does the package exist?`);
					}
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					pkgJson = thirdPartyPkgCheck as any;
				}

				const resolvedScope = pkgType === 'first-party' ? '@studiocms' : scope;
				const packageName = `${resolvedScope ? `${resolvedScope}/` : ''}${name}`;
				const pluginName = packageName;
				const dependencies: PluginInfo['dependencies'] = [[pkgJson.name, `^${pkgJson.version}`]];

				if (pkgJson.peerDependencies) {
					const meta = pkgJson.peerDependenciesMeta || {};
					for (const peer in pkgJson.peerDependencies) {
						const optional = meta[peer]?.optional || false;
						const isStudioCMS = peer === 'studiocms';
						if (!optional && !isStudioCMS) {
							dependencies.push([peer, pkgJson.peerDependencies[peer]]);
						}
					}
				}

				const keywords = Array.isArray(pkgJson.keywords) ? pkgJson.keywords : [];
				if (!keywords.includes('studiocms-plugin')) {
					throw new Error(
						`${color.bold(plugin)} doesn't appear to be an StudioCMS Plugin. Find our official plugins at ${color.magenta('https://docs.studiocms.dev')}`
					);
				}

				return {
					id: plugin,
					packageName,
					dependencies,
					pluginName,
				};
			})
		);
		spinner.success();
		return pluginEntries;
	} catch (e) {
		if (e instanceof Error) {
			spinner.error(e.message);
			process.exit(1);
		} else {
			throw e;
		}
	}
}

function parseNpmName(
	spec: string
): { scope?: string; name: string; subpath?: string } | undefined {
	// not an npm package
	if (!spec || spec[0] === '.' || spec[0] === '/') return undefined;

	let scope: string | undefined;
	let name = '';

	const parts = spec.split('/');
	if (parts[0][0] === '@') {
		scope = parts[0];
		name = `${parts.shift()}/`;
	}
	name += parts.shift();

	const subpath = parts.length ? `./${parts.join('/')}` : undefined;

	return {
		scope,
		name,
		subpath,
	};
}

function parsePluginName(spec: string) {
	const result = parseNpmName(spec);
	if (!result) return;
	let { scope, name } = result;
	let tag = 'latest';
	if (scope) {
		name = name.replace(`${scope}/`, '');
	}
	if (name.includes('@')) {
		const tagged = name.split('@');
		name = tagged[0];
		tag = tagged[1];
	}
	return { scope, name, tag };
}

export async function fetchPackageJson(
	scope: string | undefined,
	name: string,
	tag: string
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
): Promise<Record<string, any> | Error> {
	const packageName = `${scope ? `${scope}/` : ''}${name}`;
	const registry = await getRegistry();
	const res = await fetch(`${registry}/${packageName}/${tag}`);
	if (res.status >= 200 && res.status < 300) {
		return await res.json();
	}
	if (res.status === 404) {
		// 404 means the package doesn't exist, so we don't need an error message here
		return new Error();
	}
	return new Error(`Failed to fetch ${registry}/${packageName}/${tag} - GET ${res.status}`);
}

// Users might lack access to the global npm registry, this function
// checks the user's project type and will return the proper npm registry
//
// A copy of this function also exists in the create-astro package
let _registry: string;
async function getRegistry(): Promise<string> {
	if (_registry) return _registry;
	const fallback = 'https://registry.npmjs.org';
	const packageManager = (await detect())?.name || 'npm';
	try {
		const { stdout } = await exec(packageManager, ['config', 'get', 'registry']);
		_registry = stdout.trim()?.replace(/\/$/, '') || fallback;
		// Detect cases where the shell command returned a non-URL (e.g. a warning)
		if (!new URL(_registry).host) _registry = fallback;
	} catch {
		_registry = fallback;
	}
	return _registry;
}

async function askToContinue(): Promise<boolean> {
	const response = await p.confirm({
		message: 'Continue?',
		initialValue: true,
	});

	if (p.isCancel(response)) {
		return false;
	}

	return response;
}

async function convertIntegrationsToInstallSpecifiers(plugins: PluginInfo[]): Promise<string[]> {
	const ranges: Record<string, string> = {};
	for (const { dependencies } of plugins) {
		for (const [name, range] of dependencies) {
			ranges[name] = range;
		}
	}
	return Promise.all(
		Object.entries(ranges).map(([name, range]) => resolveRangeToInstallSpecifier(name, range))
	);
}

/**
 * Resolves package with a given range to a STABLE version
 * peerDependencies might specify a compatible prerelease,
 * but `astro add` should only ever install stable releases
 */
async function resolveRangeToInstallSpecifier(name: string, range: string): Promise<string> {
	const versions = await fetchPackageVersions(name);
	if (versions instanceof Error) return name;
	// Filter out any prerelease versions, but fallback if there are no stable versions
	const stableVersions = versions.filter((v) => !v.includes('-'));
	const maxStable = maxSatisfying(stableVersions, range) ?? maxSatisfying(versions, range);
	if (!maxStable) return name;
	return `${name}@^${maxStable}`;
}

export async function fetchPackageVersions(packageName: string): Promise<string[] | Error> {
	const registry = await getRegistry();
	const res = await fetch(`${registry}/${packageName}`, {
		headers: { accept: 'application/vnd.npm.install-v1+json' },
	});
	if (res.status >= 200 && res.status < 300) {
		return await res.json().then((data) => Object.keys(data.versions));
	}
	if (res.status === 404) {
		// 404 means the package doesn't exist, so we don't need an error message here
		return new Error();
	}
	return new Error(`Failed to fetch ${registry}/${packageName} - GET ${res.status}`);
}

const isWindows = process?.platform === 'win32';

function slash(path: string) {
	const isExtendedLengthPath = path.startsWith('\\\\?\\');

	if (isExtendedLengthPath) {
		return path;
	}

	return path.replace(/\\/g, '/');
}

export function pathToFileURL(path: string): URL {
	if (isWindows) {
		let slashed = slash(path);
		// Windows like C:/foo/bar
		if (!slashed.startsWith('/')) {
			slashed = `/${slashed}`;
		}
		return new URL(`file://${slashed}`);
	}

	// Unix is easy
	return new URL(`file://${path}`);
}

export function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : `${path}/`;
}
