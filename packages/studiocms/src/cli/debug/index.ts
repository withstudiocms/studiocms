import { pathToFileURL } from 'node:url';
import { StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { loadConfigFile } from '@withstudiocms/config-utils';
import { Cli, Effect } from '@withstudiocms/effect';
import { intro, log, outro } from '@withstudiocms/effect/clack';
import { DebugInfoProvider } from '@withstudiocms/internal_helpers/debug-info-provider';
import type { AstroUserConfig } from 'astro';
import chalk from 'chalk';
import type { StudioCMSOptions } from '#schemas';

const astroConfigPaths = [
	'astro.config.mjs',
	'astro.config.js',
	'astro.config.ts',
	'astro.config.cts',
	'astro.config.mts',
	'astro.config.cjs',
];

const studiocmsConfigPaths = [
	'studiocms.config.mjs',
	'studiocms.config.js',
	'studiocms.config.ts',
	'studiocms.config.cts',
	'studiocms.config.mts',
	'studiocms.config.cjs',
];

/**
 * Loads the configuration for the specified key ('astro' or 'studiocms').
 *
 * @param key - The configuration key to load ('astro' or 'studiocms').
 * @returns An Effect that resolves to the loaded configuration or undefined.
 */
const loadConfig = <K extends 'astro' | 'studiocms'>(
	key: K
): Effect.Effect<(K extends 'astro' ? AstroUserConfig : StudioCMSOptions) | undefined> =>
	Effect.tryPromise({
		try: async () => {
			const cwd = process.cwd();
			const rootURL = pathToFileURL(`${cwd}/`);
			const configPaths = key === 'astro' ? astroConfigPaths : studiocmsConfigPaths;
			return await loadConfigFile<K extends 'astro' ? AstroUserConfig : StudioCMSOptions>(
				rootURL,
				configPaths,
				key
			);
		},
		catch: (error) => {
			throw new Error(`Failed to load config: ${(error as Error).message}`);
		},
	});

export const debug = Cli.Options.boolean('debug').pipe(
	Cli.Options.optional,
	Cli.Options.withDefault(false),
	Cli.Options.withDescription('Enable debug mode')
);

export const debugCMD = Cli.Command.make('debug', { debug }, ({ debug: _debug }) =>
	Effect.gen(function* () {
		let debug: boolean;

		if (typeof _debug !== 'boolean') {
			debug = yield* _debug;
		} else {
			debug = _debug;
		}

		if (debug) {
			yield* Effect.log('Getting debug info for StudioCMS...');
		}

		const [AstroConfig, StudioCMSConfig] = yield* Effect.all([
			loadConfig('astro'),
			loadConfig('studiocms'),
		]);

		const adapterName = AstroConfig?.adapter?.name ?? 'No adapter configured';
		const databaseDialect = StudioCMSConfig?.db?.dialect ?? 'libsql'; // default dialect
		const installedPlugins =
			StudioCMSConfig?.plugins?.map(({ identifier, name }) => ({ identifier, name })) ?? [];

		if (debug) {
			yield* Effect.log(
				`Astro Adapter Name: ${adapterName}`,
				`Database Dialect: ${databaseDialect}`,
				`Installed Plugins: ${installedPlugins.length}`
			);
		}

		const infoProvider = yield* Effect.try({
			try: () =>
				new DebugInfoProvider({
					adapterName,
					databaseDialect,
					installedPlugins,
				}),
			catch: (error) =>
				new Error(`Failed to create DebugInfoProvider: ${(error as Error).message}`),
		});

		const debugInfo = yield* Effect.tryPromise({
			try: () => infoProvider.getDebugInfoString(4, { styled: true }),
			catch: (error) => new Error(`Failed to gather debug info: ${(error as Error).message}`),
		});

		if (debug) {
			yield* Effect.log('Debug info gathered successfully.');
		}

		console.log(''); // Add a blank line before debug info output

		yield* intro(`${label('StudioCMS Debug Information', StudioCMSColorwayBg, chalk.black)}`);
		yield* log.info(debugInfo);
		yield* outro();

		if (debug) {
			yield* Effect.log('Debug command completed.');
		}
	})
).pipe(Cli.Command.withDescription('Debug info for StudioCMS'));
