import color from 'chalk';
import type { Context } from '../lib/context.js';
import { StudioCMSColorway, StudioCMSColorwayBg, label, say } from '../lib/utils.js';

export async function intro(
	ctx: Pick<Context, 'welcome' | 'version' | 'username' | 'skipBanners' | 'debug' | 'logger'>
) {
	if (!ctx.skipBanners) {
		ctx.debug && ctx.logger.debug('Printing welcome message...');
		await say(
			[
				[
					'Welcome',
					'to',
					label('StudioCMS', StudioCMSColorwayBg, color.black),
					StudioCMSColorway(`v${ctx.version}`),
					ctx.username,
				],
				ctx.welcome,
			] as string[],
			{ clear: true }
		);
		ctx.debug && ctx.logger.debug('Welcome message printed');
	}
}
