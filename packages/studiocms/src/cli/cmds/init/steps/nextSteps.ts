import chalk from 'chalk';
import type { Context } from '../../../lib/context.js';
import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfoBg,
	boxen,
	label,
} from '../../../lib/utils.js';

export async function next(
	context: Pick<Context, 'cwd' | 'packageManager' | 'skipBanners' | 'debug' | 'logger' | 'p'>
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
			chalk.bold(
				`${label('Init Complete!', StudioCMSColorwayInfoBg, chalk.bold)} Get started with StudioCMS:`
			),
			{
				ln1: `Ensure your ${chalk.cyanBright('.env')} file is configured correctly.`,
				ln3: `Run ${chalk.cyan('astro db push')} to sync your database schema.`,
				ln4: `Run ${chalk.cyan(devCmd)} to start the dev server. ${chalk.cyanBright('CTRL+C')} to stop.`,
			}
		)
	);

	context.p.outro(
		`${label('Enjoy your new CMS!', StudioCMSColorwayBg, chalk.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
	);

	context.debug && context.logger.debug('Next steps complete');
}
