import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';
import { StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { shell } from '@withstudiocms/cli-kit/utils';
import { confirm, log } from '@withstudiocms/effect/clack';
import { Effect } from 'effect';
import { CLIError, type Context, type EffectStepFn } from '../context.ts';

/**
 * Git initialization step
 */
export const git: EffectStepFn = Effect.fn('git')(
	function* (ctx: Context) {
		if (ctx.debug) yield* Effect.logDebug('Running git...');
		if (fs.existsSync(path.join(ctx.cwd, '.git'))) {
			yield* log.info(StudioCMSColorwayInfo('Nice! Git has already been initialized'));
			return;
		}
		let _git = ctx.git ?? ctx.yes;
		if (_git === undefined) {
			const __git = yield* confirm({
				message: 'Initialize a new git repository?',
				initialValue: true,
			});

			if (typeof __git === 'symbol') {
				yield* log.error('Input cancelled by user.');
				ctx.exit(1);
			} else {
				yield* Effect.logDebug(`Git: ${__git}`);
				_git = __git;
			}
		}

		if (ctx.dryRun) {
			yield* log.info(
				`${StudioCMSColorwayInfo('--dry-run')} ${styleText('dim', 'Skipping Git initialization')}`
			);
		} else if (_git) {
			ctx.tasks.push({
				title: 'Git',
				// @effect-diagnostics-next-line runEffectInsideEffect:off
				task: async (message) =>
					Effect.runPromise(
						Effect.gen(function* () {
							message('Git initializing...');
							yield* init({ cwd: ctx.cwd });
							message('Git initialized');
						}).pipe(
							Effect.catchAll(
								Effect.fn(function* (err) {
									yield* log.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
									process.exit(1);
								})
							)
						)
					),
			});
		} else {
			yield* log.info(
				StudioCMSColorwayInfo(
					`${ctx.yes === false ? 'git [skip]' : 'Sounds good!'} You can always run ${styleText('reset', 'git init')}${styleText('dim', ' manually.')}`
				)
			);
		}

		if (ctx.debug) yield* Effect.logDebug('Git complete');
	},
	Effect.catchTag('ClackError', (error) => new CLIError({ cause: error }))
);

/**
 * Try to run a shell command and catch errors as CLIError
 */
const tryShell = Effect.fn('tryShell')(
	(command: string, args: string[], options: Record<string, unknown>) =>
		Effect.tryPromise({
			try: () => shell(command, args, options),
			catch: (cause) => new CLIError({ cause }),
		})
);

/**
 * Initialize git repository, add all files, and make initial commit
 */
const init = Effect.fn('init')(
	function* ({ cwd }: { cwd: string }) {
		yield* Effect.all([
			tryShell('git', ['init'], { cwd, stdio: 'ignore' }),
			tryShell('git', ['add', '-A'], { cwd, stdio: 'ignore' }),
			tryShell(
				'git',
				[
					'commit',
					'-m',
					'"Initial commit from StudioCMS"',
					'--author="Apollo Git Bot[bot] <234251158+apollo-git-bot[bot]@users.noreply.github.com>"',
				],
				{ cwd, stdio: 'ignore' }
			),
		]);
	},
	Effect.catchAll((error) => new CLIError({ cause: error }))
);
