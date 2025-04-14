import { StudioCMSColorway, StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import type { Context } from '../../../lib/context.js';

export async function next(
	context: Pick<Context, 'cwd' | 'packageManager' | 'skipBanners' | 'debug' | 'logger' | 'p' | 'c'>
) {
	context.p.outro(
		`${label('Action Complete!', StudioCMSColorwayBg, context.c.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
	);

	context.debug && context.logger.debug('Next steps complete');
}
