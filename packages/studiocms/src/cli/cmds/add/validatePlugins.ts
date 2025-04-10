import color from 'chalk';
import { askToContinue } from './askToContinue.js';
import { fetchPackageJson, parsePluginName } from './npm-utils.js';
import { type ClackPrompts, type PluginInfo, StudioCMSScopes } from './utils.js';

export async function validatePlugins(names: string[], p: ClackPrompts): Promise<PluginInfo[]> {
	const spinner = p.spinner();
	spinner.start('Resolving packages...');
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
							spinner.message(color.yellow(firstPartyPkgCheck.message));
						}
						spinner.message(
							color.yellow(`${color.bold(plugin)} is not an official StudioCMS package.`)
						);
						if (!(await askToContinue(p))) {
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
							spinner.message(color.yellow(thirdPartyPkgCheck.message));
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
		spinner.stop('Packages Resolved.');
		return pluginEntries;
	} catch (e) {
		if (e instanceof Error) {
			spinner.stop(e.message, 1);
			process.exit(1);
		} else {
			throw e;
		}
	}
}
