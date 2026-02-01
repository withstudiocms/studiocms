import { styleText } from 'node:util';
import { exec } from '@withstudiocms/cli-kit/utils';
import { askToContinue, note, spinner } from '@withstudiocms/effect/clack';
import { detect, resolveCommand } from 'package-manager-detector';
import { Console, Effect, genLogger } from '../../effect.js';
import { CliContext } from '../utils/context.js';
import { effectBoxen } from '../utils/effectBoxen.js';
import { StudioCMSCliError } from '../utils/errors.js';
import { type PluginInfo, UpdateResult } from './index.js';
import { convertPluginsToInstallSpecifiers } from './npm-utils.js';

export class TryToInstallPlugins extends Effect.Service<TryToInstallPlugins>()(
	'TryToInstallPlugins',
	{
		effect: genLogger('studiocms/cli/add/validatePlugins/TryToInstallPlugins.effect')(function* () {
			const run = (plugins: PluginInfo[]) =>
				genLogger('studiocms/cli/add/validatePlugins/TryToInstallPlugins.effect.run')(function* () {
					const { cwd } = yield* CliContext;

					const packageManager = yield* Effect.tryPromise(() =>
						detect({
							cwd,
							// Include the `install-metadata` strategy to have the package manager that's
							// used for installation take precedence
							strategies: ['install-metadata', 'lockfile', 'packageManager-field'],
						})
					);

					yield* Console.debug(`[add]: package manager: '${packageManager?.name || 'none'}'`);

					if (!packageManager) {
						yield* Console.error(
							'[add]: No package manager detected. Please ensure npm, yarn, pnpm, or another supported package manager is installed.'
						);
						return UpdateResult.none;
					}

					const agent = packageManager?.agent ?? 'npm';
					if (!packageManager?.agent) {
						yield* Console.debug('[add]: No package manager agent detected, falling back to npm');
					}
					const installCommand = resolveCommand(agent, 'add', []);
					if (!installCommand) return UpdateResult.none;

					const installSpecifiers = (yield* convertPluginsToInstallSpecifiers(plugins)).map(
						(specifier) =>
							installCommand.command === 'deno'
								? `npm:${specifier}` // Deno requires npm prefix to install packages
								: specifier
					);

					const coloredOutput = `${styleText('bold', installCommand.command)} ${installCommand.args.join(' ')} ${styleText('magenta', installSpecifiers.join(' '))}`;

					const boxenMessage = yield* effectBoxen((boxen) =>
						boxen(coloredOutput, {
							margin: 0.5,
							padding: 0.5,
							borderStyle: 'round',
						})
					);

					const message = `\n${boxenMessage}\n`;

					yield* note(
						`${styleText('magenta', 'StudioCMS will run the following command:')}\n ${styleText('dim', 'If you skip this step, you can always run it yourself later')}\n${message}`
					);

					if (yield* askToContinue()) {
						const spin = yield* spinner();
						yield* spin.start('Installing dependencies...');

						const response = yield* Effect.tryPromise({
							try: async () => {
								await exec(installCommand.command, [...installCommand.args, ...installSpecifiers], {
									nodeOptions: {
										cwd,
										env: { NODE_ENV: undefined },
									},
								});
								return UpdateResult.updated;
							},
							catch: (err) =>
								new StudioCMSCliError({
									message: `Failed to install dependencies: ${err instanceof Error ? err.message : String(err)}`,
									cause: err,
								}),
						}).pipe(Effect.catchAll((err) => Effect.succeed(err)));

						if (response === UpdateResult.updated) {
							yield* spin.stop('Dependencies installed!');
							return response;
						}

						if (
							response instanceof Error ||
							(response && typeof response === 'object' && 'message' in response)
						) {
							yield* spin.stop('Error installing dependencies');
							yield* Console.debug(`[add]: Error installing dependencies ${response}`);
							// NOTE: `err.stdout` can be an empty string, so log the full error instead for a more helpful log
							// @ts-expect-error
							yield* Console.error(`\n${response.stdout || response.message}\n`);
							yield* Console.error(
								`\n${styleText('yellow', 'You may want to try:')}\n- Checking your network connection\n- Running the package manager command manually\n- Ensuring you have permissions to install packages\n`
							);
							return UpdateResult.failure;
						}

						return response as UpdateResult;
					}

					return UpdateResult.cancelled;
				});

			return { run };
		}),
	}
) {}
