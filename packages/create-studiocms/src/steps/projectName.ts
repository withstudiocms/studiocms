import path from 'node:path';
import { styleText } from 'node:util';
import { StudioCMSColorwayInfo, StudioCMSColorwayWarn } from '@withstudiocms/cli-kit/colors';
import { log, text } from '@withstudiocms/effect/clack';
import { Effect } from 'effect';
import { CLIError, type Context, type EffectStepFn } from '../context.ts';
import { generateProjectName } from '../utils/project-name.ts';
import { isEmpty, toValidName } from './_shared.ts';

/**
 * Prompt for project name and set cwd accordingly
 */
export const projectName: EffectStepFn = Effect.fn('projectName')(
	function* (ctx: Context) {
		if (ctx.debug) yield* Effect.logDebug('Running projectName...');

		if (ctx.debug) yield* Effect.logDebug('Checking cwd...');
		yield* checkCwd(ctx.cwd);

		if (!ctx.cwd || !isEmpty(ctx.cwd)) {
			if (!isEmpty(ctx.cwd)) {
				yield* log.warn(
					`${StudioCMSColorwayWarn('Hmm...')} ${styleText('reset', `"${ctx.cwd}"`)}${styleText('dim', ' is not empty!')}`
				);
			}

			if (ctx.yes) {
				ctx.projectName = generateProjectName();
				ctx.cwd = `./${ctx.projectName}`;
				yield* log.info(StudioCMSColorwayInfo(`Project created at ./${ctx.projectName}`));
				return;
			}

			const name = yield* text({
				message: 'Where should we create your new project?',
				initialValue: `./${generateProjectName()}`,
				validate(value) {
					if (!value || value.trim().length === 0) {
						return 'Project directory cannot be empty!';
					}
					if (!isEmpty(value)) {
						return 'Directory is not empty!';
					}
					// Check for non-printable characters
					if (value.match(/[^\x20-\x7E]/g) !== null)
						return 'Invalid non-printable character present!';
				},
			});

			if (typeof name === 'symbol') {
				yield* log.error('Input cancelled by user.');
				ctx.exit(1);
			} else {
				ctx.cwd = name.trim();
				ctx.projectName = toValidName(name);
				if (ctx.dryRun) {
					yield* log.info(
						`${StudioCMSColorwayInfo('--dry-run')} ${styleText('dim', 'Skipping project naming')}`
					);
					return;
				}
			}
		} else {
			let name = ctx.cwd;
			if (name === '.' || name === './') {
				const parts = process.cwd().split(path.sep);
				name = parts[parts.length - 1];
			} else if (name.startsWith('./') || name.startsWith('../')) {
				const parts = name.split('/');
				name = parts[parts.length - 1];
			}
			ctx.projectName = toValidName(name);
		}

		if (!ctx.cwd) {
			ctx.exit(1);
		}

		if (ctx.debug) yield* Effect.logDebug(`Project name: ${ctx.projectName}`);
	},
	Effect.catchTag('ClackError', (error) => new CLIError({ cause: error }))
);

/**
 * Check if cwd is empty
 */
const checkCwd = Effect.fn('checkCwd')(function* (cwd: string | undefined) {
	const empty = cwd && isEmpty(cwd);
	if (empty) {
		yield* log.info(
			StudioCMSColorwayInfo(
				`Using ${styleText('reset', cwd)}${styleText('dim', ' as project directory')}`
			)
		);
	}

	return empty;
});
