import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';
import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { shell } from '@withstudiocms/cli-kit/utils';
import { confirm, log } from '@withstudiocms/effect/clack';
import { Effect } from 'effect';
import { CLIError, type Context, type EffectStepFn } from '../context.ts';

/**
 * Dependency installation step
 */
export const dependencies: EffectStepFn = Effect.fn('dependencies')(
	function* (ctx: Context) {
		if (ctx.debug) yield* Effect.logDebug('Running dependencies...');
		let deps = ctx.install ?? ctx.yes;
		if (deps === undefined) {
			const _deps = yield* confirm({
				message: 'Would you like to install dependencies?',
				initialValue: true,
			});

			if (typeof _deps === 'symbol') {
				yield* log.error('Input cancelled by user.');
				ctx.exit(1);
			} else {
				if (ctx.debug) yield* Effect.logDebug(`Dependencies: ${_deps}`);

				deps = _deps;
			}

			ctx.install = deps;
		}

		if (ctx.dryRun) {
			yield* log.info(
				`${StudioCMSColorwayInfo('--dry-run')} ${styleText('dim', 'Skipping dependency installation')}`
			);
		} else if (deps) {
			ctx.tasks.push({
				title: 'Install dependencies',
				// @effect-diagnostics-next-line runEffectInsideEffect:off
				task: async (message) =>
					Effect.runPromise(
						Effect.gen(function* () {
							message('Installing dependencies...');
							yield* install({ packageManager: ctx.packageManager, cwd: ctx.cwd });
							message('Dependencies installed');
						}).pipe(
							Effect.catchAll(
								Effect.fn(function* (err) {
									yield* log.error(
										`Error: ${err instanceof Error ? err.message : 'Unable to install dependencies'}`
									);
									yield* log.error(
										StudioCMSColorwayError(
											`Error: Dependencies failed to install, please run ${styleText('bold', `${ctx.packageManager} install`)} to install them manually after setup.`
										)
									);
									process.exit(1);
								})
							)
						)
					),
			});
		} else {
			yield* log.info(
				StudioCMSColorwayInfo(
					`${ctx.yes === false ? 'deps [skip]' : 'No problem!'} 'Remember to install dependencies after setup.'`
				)
			);
		}

		if (ctx.debug) yield* Effect.logDebug('Dependencies complete');
	},
	Effect.catchTag('ClackError', (error) => new CLIError({ cause: error }))
);

/**
 * Install dependencies using the specified package manager
 */
const install = Effect.fn('install')(function* ({
	packageManager,
	cwd,
}: {
	packageManager: string;
	cwd: string;
}) {
	if (packageManager === 'yarn') yield* ensureYarnLock({ cwd });
	return yield* Effect.tryPromise({
		try: async () => shell(packageManager, ['install'], { cwd, timeout: 90000, stdio: 'ignore' }),
		catch: (cause) => new CLIError({ cause }),
	});
});

/**
 * Ensure yarn.lock exists to prevent yarn from defaulting to npm
 */
const ensureYarnLock = Effect.fn('ensureYarnLock')(function* ({ cwd }: { cwd: string }) {
	const yarnLock = path.join(cwd, 'yarn.lock');
	if (fs.existsSync(yarnLock)) return;
	return yield* Effect.tryPromise({
		try: () => fs.promises.writeFile(yarnLock, '', { encoding: 'utf-8' }),
		catch: (cause) => new CLIError({ cause }),
	});
});
