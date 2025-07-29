import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { askToContinue } from '@withstudiocms/cli-kit/messages';
import { diffWords } from 'diff';
import { generateCode, type ProxifiedModule } from 'magicast';
import { Console, Effect, genLogger } from '../../effect.js';
import { CliContext } from '../utils/context.js';
import { effectBoxen } from '../utils/effectBoxen.js';
import { UpdateResult } from './index.js';

export class UpdateStudioCMSConfig extends Effect.Service<UpdateStudioCMSConfig>()(
	'UpdateStudioCMSConfig',
	{
		effect: genLogger('studiocms/cli/add/updateStudioCMSConfig/UpdateStudioCMSConfig.effect')(
			function* () {
				// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any.
				const run = (configURL: URL, mod: ProxifiedModule<any>) =>
					genLogger('studiocms/cli/add/updateStudioCMSConfig/UpdateStudioCMSConfig.effect.run')(
						function* () {
							const context = yield* CliContext;
							const { prompts, chalk } = context;

							const input = yield* Effect.tryPromise(() =>
								fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' })
							);
							const output = yield* Effect.try(
								() =>
									generateCode(mod, {
										format: {
											objectCurlySpacing: true,
											useTabs: false,
											tabWidth: 2,
										},
									}).code
							);

							if (input === output) return UpdateResult.none;

							const diff = yield* getDiffContent(input, output).pipe(
								CliContext.makeProvide(context)
							);

							if (!diff) return UpdateResult.none;

							const boxenMessage = yield* effectBoxen((boxen) =>
								boxen(diff, {
									margin: 0.5,
									padding: 0.5,
									borderStyle: 'round',
									title: configURL.pathname.split('/').pop(),
								})
							);

							const message = `\n${boxenMessage}\n`;

							prompts.note(
								`\n ${chalk.magenta('StudioCMS will make the following changes to your config file:')}\n${message}`
							);

							if (yield* Effect.tryPromise(() => askToContinue(prompts))) {
								yield* Effect.tryPromise(() =>
									fs.writeFile(fileURLToPath(configURL), output, { encoding: 'utf-8' })
								);
								yield* Console.debug('Updated studiocms config');
								return UpdateResult.updated;
							}
							return UpdateResult.cancelled;
						}
					);

				return { run };
			}
		),
	}
) {}

const getDiffContent = (input: string, output: string) =>
	genLogger('studiocms/cli/add/updateStudioCMSConfig.getDiffContentNew')(function* () {
		const { chalk } = yield* CliContext;
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
				.map((ln) => (ln ? chalk.green(ln) : ''))
				.join('\n');
			diffed = diffed.replace(newContent, coloredOutput);
		}

		return diffed;
	});
