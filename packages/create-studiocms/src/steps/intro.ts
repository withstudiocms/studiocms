import { StudioCMSColorway, StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label, say } from '@withstudiocms/cli-kit/messages';
import { Effect } from 'effect';
import type { Context, EffectStepFn } from '../context.ts';

/**
 * Intro step to welcome the user
 */
export const intro: EffectStepFn = Effect.fn('intro')(function* (ctx: Context) {
	if (!ctx.skipBanners) {
		if (ctx.debug) Effect.logDebug('Printing welcome message...');
		yield* Effect.promise(() =>
			say(
				[
					[
						'Welcome',
						'to',
						label('StudioCMS', StudioCMSColorwayBg, 'black'),
						StudioCMSColorway(`v${ctx.version}`),
						ctx.username,
					],
					ctx.welcome,
				] as string[],
				{ clear: true }
			)
		);
		if (ctx.debug) Effect.logDebug('Welcome message printed');
	}
});
