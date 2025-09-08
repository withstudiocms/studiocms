import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfoBg,
} from '@withstudiocms/cli-kit/colors';
import { boxen, label } from '@withstudiocms/cli-kit/messages';
import { log, outro } from '@withstudiocms/effect/clack';
import { Effect, genLogger } from '../../../effect.js';
import { CliContext } from '../../utils/context.js';
import { buildDebugLogger } from '../../utils/logger.js';

const commandMap: { [key: string]: string } = {
	npm: 'npm run dev',
	bun: 'bun run dev',
	yarn: 'yarn dev',
	pnpm: 'pnpm dev',
};

export const next = (debug: boolean) =>
	genLogger('studiocms/cli/init/steps/next')(function* () {
		const [{ chalk, packageManager }, debugLogger] = yield* Effect.all([
			CliContext,
			buildDebugLogger(debug),
		]);

		const devCmd = commandMap[packageManager as keyof typeof commandMap] || 'npm run dev';

		yield* Effect.all([
			debugLogger(`Dev command: ${devCmd}`),
			debugLogger('Running next steps fn...'),
			log.success(
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
			),
		]);

		yield* Effect.all([
			outro(
				`${label('Enjoy your new CMS!', StudioCMSColorwayBg, chalk.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
			),
			debugLogger('Next steps complete'),
		]);
	});
