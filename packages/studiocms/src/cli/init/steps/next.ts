import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfoBg,
} from '@withstudiocms/cli-kit/colors';
import { boxen, label } from '@withstudiocms/cli-kit/messages';
import { genLogger } from '../../../effect.js';
import { CliContext } from '../../utils/context.js';
import { logger } from '../../utils/logger.js';

export const next = (debug: boolean) =>
	genLogger('studiocms/cli/init/steps/next')(function* () {
		const context = yield* CliContext;
		const { prompts, chalk } = context;

		const commandMap: { [key: string]: string } = {
			npm: 'npm run dev',
			bun: 'bun run dev',
			yarn: 'yarn dev',
			pnpm: 'pnpm dev',
		};

		const devCmd = commandMap[context.packageManager as keyof typeof commandMap] || 'npm run dev';

		debug && logger.debug(`Dev command: ${devCmd}`);

		debug && logger.debug('Running next steps fn...');

		prompts.log.success(
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

		prompts.outro(
			`${label('Enjoy your new CMS!', StudioCMSColorwayBg, chalk.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
		);

		debug && logger.debug('Next steps complete');
	});
