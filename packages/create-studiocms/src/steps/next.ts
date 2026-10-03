import path from 'node:path';
import { styleText } from 'node:util';
import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfo,
	StudioCMSColorwayInfoBg,
} from '@withstudiocms/cli-kit/colors';
import { boxen, label } from '@withstudiocms/cli-kit/messages';
import { log, outro } from '@withstudiocms/effect/clack';
import { Effect } from '@withstudiocms/effect/effect';
import type { Context } from '../context.ts';

/**
 * Display next steps to the user after project setup
 */
export const next = Effect.fn('next')(
	function* (
		ctx: Pick<Context, 'cwd' | 'packageManager' | 'skipBanners' | 'debug' | 'isStudioCMSProject'>
	) {
		if (ctx.debug) yield* Effect.logDebug('Running next steps...');
		const projectDir = path.relative(process.cwd(), ctx.cwd);

		if (ctx.debug) yield* Effect.logDebug(`Project directory: ${projectDir}`);

		const commandMap: { [key: string]: string } = {
			npm: 'npm run dev',
			bun: 'bun run dev',
			yarn: 'yarn dev',
			pnpm: 'pnpm dev',
		};

		const devCmd = commandMap[ctx.packageManager as keyof typeof commandMap] || 'npm run dev';

		if (ctx.debug)
			yield* Effect.all([
				Effect.logDebug(`Dev command: ${devCmd}`),
				Effect.logDebug('Running next steps fn...'),
			]);

		const cyanTxt = (text: string) => styleText('cyan', text);
		const cyanBrightTxt = (text: string) => styleText('cyanBright', text);

		yield* log.success(
			boxen(
				styleText(
					'bold',
					`${label('Setup Complete!', StudioCMSColorwayInfoBg, 'bold')} Explore your new project! 🚀`
				),
				{
					ln0: ctx.isStudioCMSProject
						? `Run ${cyanTxt('studiocms init')} to setup your StudioCMS project.`
						: '',
					ln2: `Enter your project directory using ${StudioCMSColorwayInfo(`cd ${projectDir}`)}`,
					ln3: ctx.isStudioCMSProject
						? `Run ${cyanTxt('studiocms migrate')} to sync your database schema.`
						: `Run ${cyanTxt(devCmd)} to start the dev server. ${cyanBrightTxt('CTRL+C')} to stop.`,
					ln4: ctx.isStudioCMSProject
						? `Run ${cyanTxt(devCmd)} to start the dev server. ${cyanBrightTxt('CTRL+C')} to stop.`
						: '',
				}
			)
		);

		yield* outro(
			`${label(ctx.isStudioCMSProject ? 'Enjoy your new CMS!' : 'Enjoy your new project!', StudioCMSColorwayBg, 'bold')} Stuck? Join us on Discord at ${StudioCMSColorway(styleText(['bold', 'underline'], 'https://chat.studiocms.dev'))}`
		);

		if (ctx.debug) yield* Effect.logDebug('Next steps complete');
	},
	Effect.catchTag('ClackError', Effect.logError)
);
