import color from 'chalk';
import type { Context } from '../lib/context.js';
import { StudioCMSColorway, StudioCMSColorwayBg, label, say } from '../lib/utils.js';

export async function intro(
	context: Pick<Context, 'welcome' | 'version' | 'username' | 'skipBanners' | 'debug' | 'logger'>
) {
	if (!context.skipBanners) {
		context.debug && context.logger.debug('Printing welcome message...');
		await say(
			[
				[
					'Welcome',
					'to',
					label('StudioCMS', StudioCMSColorwayBg, color.black),
					StudioCMSColorway(`v${context.version}`),
					context.username,
				],
				context.welcome,
			] as string[],
			{ clear: true }
		);
		context.debug && context.logger.debug('Welcome message printed');
	}
}
