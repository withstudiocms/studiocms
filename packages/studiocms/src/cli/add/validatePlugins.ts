import { styleText } from 'node:util';
import { askToContinue, spinner } from '@withstudiocms/effect/clack';
import { Effect, genLogger } from '../../effect.js';
import { type PluginInfo, StudioCMSScopes } from './index.js';
import { fetchPackageJson, parsePluginName } from './npm-utils.js';

export class ValidatePlugins extends Effect.Service<ValidatePlugins>()('ValidatePlugins', {
	effect: genLogger('studiocms/cli/add/validatePlugins/ValidatePlugins.effect')(function* () {
		const run = (names: string[]) =>
			genLogger('studiocms/cli/add/validatePlugins/ValidatePlugins.effect.run')(function* () {
				const spin = yield* spinner();

				yield* spin.start('Resolving packages...');

				const entries: PluginInfo[] = [];

				for (const plugin of names) {
					const parsed = yield* parsePluginName(plugin);

					if (!parsed)
						throw new Error(
							`${styleText('bold', plugin)} does not appear to be a valid package name!`
						);

					const { scope, name, tag } = parsed;

					// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any
					let pkgJson: any = {};
					let pkgType: 'first-party' | 'third-party';

					if (scope && !StudioCMSScopes.includes(scope)) {
						pkgType = 'third-party';
					} else {
						const firstPartyPkgCheck = yield* fetchPackageJson(scope, name, tag);
						if (firstPartyPkgCheck instanceof Error) {
							if (firstPartyPkgCheck.message) {
								yield* spin.message(styleText('yellow', firstPartyPkgCheck.message));
							}
							yield* spin.message(
								styleText(
									'yellow',
									`${styleText('bold', plugin)} is not an official StudioCMS package.`
								)
							);
							if (!(yield* askToContinue())) {
								throw new Error(
									`No problem! Find our official plugins at ${styleText('magenta', 'https://docs.studiocms.dev')}`
								);
							}
							yield* spin.start('Resolving with third party packages...');
							pkgType = 'third-party';
						} else {
							pkgType = 'first-party';
							// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any
							pkgJson = firstPartyPkgCheck as any;
						}
					}

					if (pkgType === 'third-party') {
						const thirdPartyPkgCheck = yield* fetchPackageJson(scope, name, tag);
						if (thirdPartyPkgCheck instanceof Error) {
							if (thirdPartyPkgCheck.message) {
								yield* spin.message(styleText('yellow', thirdPartyPkgCheck.message));
							}
							throw new Error(
								`Unable to fetch ${styleText('bold', plugin)}. Does the package exist?`
							);
						}
						// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any
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
							`${styleText('bold', plugin)} doesn't appear to be an StudioCMS Plugin. Find our official plugins at ${styleText('magenta', 'https://docs.studiocms.dev')}`
						);
					}

					entries.push({
						id: plugin,
						packageName,
						dependencies,
						pluginName,
					});
				}

				yield* spin.stop('Packages Resolved.');
				return entries;
			});

		return { run };
	}),
}) {}
