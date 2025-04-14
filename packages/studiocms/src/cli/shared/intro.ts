import { StudioCMSColorway, StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label, say } from '@withstudiocms/cli-kit/messages';
import type { Context } from '../lib/context.js';

export async function intro(
	context: Pick<
		Context,
		'welcome' | 'version' | 'username' | 'skipBanners' | 'debug' | 'logger' | 'c'
	>
) {
	if (!context.skipBanners) {
		context.debug && context.logger.debug('Printing welcome message...');
		await say(
			[
				[
					'Welcome',
					'to',
					label('StudioCMS', StudioCMSColorwayBg, context.c.black),
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
