import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfoBg,
} from '@withstudiocms/cli-kit/colors';
import { boxen, label } from '@withstudiocms/cli-kit/messages';
import type { Context } from '../../../lib/context.js';

export async function next(
	context: Pick<Context, 'cwd' | 'packageManager' | 'skipBanners' | 'debug' | 'logger' | 'p' | 'c'>
) {
	const commandMap: { [key: string]: string } = {
		npm: 'npm run dev',
		bun: 'bun run dev',
		yarn: 'yarn dev',
		pnpm: 'pnpm dev',
	};

	const devCmd = commandMap[context.packageManager as keyof typeof commandMap] || 'npm run dev';

	context.debug && context.logger.debug(`Dev command: ${devCmd}`);

	context.debug && context.logger.debug('Running next steps fn...');

	context.p.log.success(
		boxen(
			context.c.bold(
				`${label('Init Complete!', StudioCMSColorwayInfoBg, context.c.bold)} Get started with StudioCMS:`
			),
			{
				ln1: `Ensure your ${context.c.cyanBright('.env')} file is configured correctly.`,
				ln3: `Run ${context.c.cyan('astro db push')} to sync your database schema.`,
				ln4: `Run ${context.c.cyan(devCmd)} to start the dev server. ${context.c.cyanBright('CTRL+C')} to stop.`,
			}
		)
	);

	context.p.outro(
		`${label('Enjoy your new CMS!', StudioCMSColorwayBg, context.c.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
	);

	context.debug && context.logger.debug('Next steps complete');
}
