import chalk from 'chalk';
import type { Context } from '../../../lib/context.js';
import { StudioCMSColorway, StudioCMSColorwayBg, label } from '../../../lib/utils.js';

export async function next(
	ctx: Pick<Context, 'cwd' | 'packageManager' | 'skipBanners' | 'debug' | 'logger' | 'p'>
) {
	ctx.p.outro(
		`${label('Action Complete!', StudioCMSColorwayBg, chalk.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
	);

	ctx.debug && ctx.logger.debug('Next steps complete');
}
