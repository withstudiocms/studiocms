import { styleText } from 'node:util';
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

const runCmdMap: { [key: string]: string } = {
	npm: 'npm run',
	bun: 'bun run',
	yarn: 'yarn run',
	pnpm: 'pnpm run',
};

export const next = (debug: boolean) =>
	genLogger('studiocms/cli/init/steps/next')(function* () {
		const [{ packageManager }, debugLogger] = yield* Effect.all([
			CliContext,
			buildDebugLogger(debug),
		]);

		const devCmd = commandMap[packageManager as keyof typeof commandMap] || 'npm run dev';

		const runCmd = runCmdMap[packageManager as keyof typeof runCmdMap] || 'npm run';

		yield* Effect.all([
			debugLogger(`Dev command: ${devCmd}`),
			debugLogger('Running next steps fn...'),
			log.success(
				boxen(
					styleText(
						'bold',
						`${label('Init Complete!', StudioCMSColorwayInfoBg, 'bold')} Get started with StudioCMS:`
					),
					{
						ln1: `Ensure your ${styleText('cyanBright', '.env')} file is configured correctly.`,
						ln3: `Run ${styleText('cyan', `${runCmd} studiocms migrate`)} to sync your database schema.`,
						ln4: `Run ${styleText('cyan', devCmd)} to start the dev server. ${styleText('cyanBright', 'CTRL+C')} to stop.`,
					}
				)
			),
		]);

		yield* Effect.all([
			outro(
				`${label('Enjoy your new CMS!', StudioCMSColorwayBg, 'bold')} Stuck? Join us on Discord at ${StudioCMSColorway(styleText(['bold', 'underline'], 'https://chat.studiocms.dev'))}`
			),
			debugLogger('Next steps complete'),
		]);
	});
