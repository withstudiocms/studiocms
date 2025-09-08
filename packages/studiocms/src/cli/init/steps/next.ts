import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfoBg,
} from '@withstudiocms/cli-kit/colors';
import { boxen, label } from '@withstudiocms/cli-kit/messages';
import { log, outro } from '@withstudiocms/effect/clack';
import { genLogger } from '../../../effect.js';
import { CliContext } from '../../utils/context.js';
import { logger } from '../../utils/logger.js';

const commandMap: { [key: string]: string } = {
	npm: 'npm run dev',
	bun: 'bun run dev',
	yarn: 'yarn dev',
	pnpm: 'pnpm dev',
};

export const next = (debug: boolean) =>
	genLogger('studiocms/cli/init/steps/next')(function* () {
		const { chalk, packageManager } = yield* CliContext;

		const devCmd = commandMap[packageManager as keyof typeof commandMap] || 'npm run dev';

		debug && logger.debug(`Dev command: ${devCmd}`);

		debug && logger.debug('Running next steps fn...');

		yield* log.success(
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

		yield* outro(
			`${label('Enjoy your new CMS!', StudioCMSColorwayBg, chalk.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
		);

		debug && logger.debug('Next steps complete');
	});
