import dns from 'node:dns/promises';
import { styleText } from 'node:util';
import { verifyTemplate } from '@bluwy/giget-core';
import { StudioCMSColorwayError, StudioCMSColorwayInfo } from '@withstudiocms/cli-kit/colors';
import { log } from '@withstudiocms/effect/clack';
import { Effect } from 'effect';
import { CLIError, type Context, type EffectStepFn } from '../context.ts';
import { getTemplateTarget } from './template.ts';

/**
 * Verify internet connection and template availability
 */
export const verify: EffectStepFn = Effect.fn('verify')(
	function* (ctx: Context) {
		if (!ctx.dryRun) {
			if (ctx.debug) yield* Effect.log('Checking internet connection...');
			const online = yield* isOnline();
			if (!online) {
				yield* log.error(StudioCMSColorwayError('Error: Unable to connect to the internet.'));
				ctx.exit(1);
			}
			if (ctx.debug) yield* Effect.log('Internet connection verified');
		}

		if (ctx.template) {
			if (ctx.debug) yield* Effect.log('Verifying template...');
			const target = getTemplateTarget(ctx.template, ctx.templateRegistry, ctx.templateRef);
			const ok = yield* Effect.promise(() => verifyTemplate(target));
			if (!ok) {
				yield* log.error(
					StudioCMSColorwayError(
						`Error: Template ${styleText('reset', ctx.template)} ${styleText('dim', 'could not be found!')}`
					)
				);
				yield* log.info(
					StudioCMSColorwayInfo(
						`Check ${ctx.templateRegistry.currentRepositoryUrl} for available templates.`
					)
				);
				ctx.exit(1);
			}
			if (ctx.debug) yield* Effect.log('Template verified');
		}
	},
	Effect.catchTag('ClackError', (error) => new CLIError({ cause: error }))
);

/**
 * Check if we are online by resolving github.com
 */
const isOnline = Effect.fn('isOnline')(() =>
	Effect.tryPromise({
		try: () =>
			dns.lookup('github.com').then(
				() => true,
				() => false
			),
		catch: (cause) => new CLIError({ cause }),
	})
);
