import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { Cli, Effect } from '@withstudiocms/effect';
import { intro, log, outro } from '@withstudiocms/effect/clack';
import { DebugInfoProvider } from '@withstudiocms/internal_helpers/debug-info-provider';
import chalk from 'chalk';
import { loadAstroConfig } from './utils/loadAstroConfig.js';
import { loadStudioCMSConfig } from './utils/loadStudioCMSConfig.js';

export const debugCMD = Cli.Command.make('debug', {}, () =>
	Effect.gen(function* () {
		yield* Effect.logDebug('Getting debug info for StudioCMS...');

		const [AstroConfig, StudioCMSConfig] = yield* Effect.all([
			loadAstroConfig,
			loadStudioCMSConfig,
		]);

		const adapterName = AstroConfig?.adapter?.name ?? 'No adapter configured';
		const databaseDialect = StudioCMSConfig?.db?.dialect ?? 'libsql'; // default dialect
		const installedPlugins =
			StudioCMSConfig?.plugins?.map(({ identifier, name }) => ({ identifier, name })) ?? [];

		yield* Effect.logDebug(
			`Astro Adapter Name: ${adapterName}`,
			`Database Dialect: ${databaseDialect}`,
			`Installed Plugins: ${installedPlugins.length}`
		);

		const infoProvider = new DebugInfoProvider({
			adapterName,
			databaseDialect,
			installedPlugins,
		});

		const debugInfo = yield* Effect.tryPromise({
			try: () => infoProvider.getDebugInfoString(4, { styled: true }),
			catch: (error) => new Error(`Failed to gather debug info: ${(error as Error).message}`),
		});

		console.log(''); // Add a blank line before debug info output

		yield* intro(`${label('StudioCMS Debug Information', StudioCMSColorwayBg, chalk.black)}`);
		yield* log.info(debugInfo);
		yield* outro();
	})
).pipe(Cli.Command.withDescription('Debug info for StudioCMS'));
