import { askToContinue } from '@withstudiocms/cli-kit/messages';
import { Effect, genLogger } from '../../effect.js';
import { CliContext } from '../utils/context.js';
import { type PluginInfo, StudioCMSScopes } from './index.js';
import { fetchPackageJson, parsePluginName } from './npm-utils.js';

export class ValidatePlugins extends Effect.Service<ValidatePlugins>()('ValidatePlugins', {
	effect: genLogger('studiocms/cli/add/validatePlugins/ValidatePlugins.effect')(function* () {
		const run = (names: string[]) =>
			genLogger('studiocms/cli/add/validatePlugins/ValidatePlugins.effect.run')(function* () {
				const { prompts, chalk } = yield* CliContext;
				const spinner = yield* Effect.try(() => prompts.spinner());

				spinner.start('Resolving packages...');

				const entries: PluginInfo[] = [];

				for (const plugin of names) {
					const parsed = yield* parsePluginName(plugin);

					if (!parsed)
						throw new Error(`${chalk.bold(plugin)} does not appear to be a valid package name!`);

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
								spinner.message(chalk.yellow(firstPartyPkgCheck.message));
							}
							spinner.message(
								chalk.yellow(`${chalk.bold(plugin)} is not an official StudioCMS package.`)
							);
							if (!(yield* Effect.tryPromise(() => askToContinue(prompts)))) {
								throw new Error(
									`No problem! Find our official plugins at ${chalk.magenta('https://docs.studiocms.dev')}`
								);
							}
							spinner.start('Resolving with third party packages...');
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
								spinner.message(chalk.yellow(thirdPartyPkgCheck.message));
							}
							throw new Error(`Unable to fetch ${chalk.bold(plugin)}. Does the package exist?`);
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
							`${chalk.bold(plugin)} doesn't appear to be an StudioCMS Plugin. Find our official plugins at ${chalk.magenta('https://docs.studiocms.dev')}`
						);
					}

					entries.push({
						id: plugin,
						packageName,
						dependencies,
						pluginName,
					});
				}

				spinner.stop('Packages Resolved.');
				return entries;
			});

		return { run };
	}),
}) {}
