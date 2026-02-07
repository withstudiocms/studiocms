#!/usr/bin/env node
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfigFile, parseAndMerge } from '@withstudiocms/config-utils';
import dotenv from 'dotenv';
import { configPaths } from 'studiocms/consts';
import { StudioCMSOptionsSchema } from 'studiocms/schemas';
import { Logger } from './utils/logger.mjs';
import createPathResolver from './utils/resolver.mjs';

const logger = new Logger({ level: 'info' }, '@studiocms/migrator');

/**
 * Asynchronously loads the StudioCMS configuration for the current project, merges it with
 * a minimal default configuration, and populates process.env with derived environment variables.
 *
 * Behavior:
 * - Computes the project root URL from process.cwd() using pathToFileURL.
 * - Attempts to load a user configuration via loadConfigFile(rootPath, configPaths, 'db-migrator-util').
 * - Logs whether a config file was found or if the default configuration will be used.
 * - Constructs a minimal default configuration via StudioCMSOptionsSchema.parse({}).
 * - Merges the loaded user configuration (if any) with the default using parseAndMerge.
 * - Sets the STUDIOCMS_DIALECT environment variable from the merged user configuration
 *   and writes it into process.env using dotenv.populate(..., { quiet: true }).
 *
 * Notes:
 * - The function produces side effects: console output and mutation of process.env.
 * - The implementation depends on surrounding module-scope values/exports such as
 *   pathToFileURL, configPaths, loadConfigFile, StudioCMSOptionsSchema, parseAndMerge, and dotenv.
 *
 * @async
 * @function loadCMSConfigFile
 * @returns {Promise<void>} Resolves when the configuration has been loaded, merged, and environment variables populated.
 * @throws {Error} If loading, parsing, or merging the configuration fails (errors bubbled from loadConfigFile,
 *                 StudioCMSOptionsSchema.parse, parseAndMerge, or dotenv.populate).
 * @example
 * // Usage (top-level await or from an async function):
 * await loadCMSConfigFile();
 */
async function loadCMSConfigFile() {
	try {
		// Determine the root path of the project
		const rootPath = pathToFileURL(join(createPathResolver(process.cwd()).resolve('.'), './'));

		// Load StudioCMS Config file
		const configFile = await loadConfigFile(rootPath, configPaths, 'db-migrator-util');

		// Log whether the config file was found
		if (configFile) {
			logger.info('Loaded StudioCMS config file successfully.');
		} else {
			logger.warn('No StudioCMS config file found, using default configuration.');
		}

		// Merge user config with default config
		const userConfig = parseAndMerge(StudioCMSOptionsSchema, configFile);

		// Set custom environment variables based on user config
		const customENV = { STUDIOCMS_DIALECT: userConfig.db.dialect };

		// Populate process.env with custom environment variables
		dotenv.populate(process.env, customENV, { quiet: true });
	} catch (error) {
		logger.error(
			`Error loading StudioCMS configuration: ${error instanceof Error ? error.message : String(error)}`
		);
		throw error;
	}
}

/**
 * Asynchronously serves the Astro-based UI for the migrator tool.
 *
 * This function dynamically imports the necessary Astro modules and starts
 * the development server with the StudioCMS UI integration for styles and components.
 *
 * Behavior:
 * - Dynamically imports 'astro', '@astrojs/node', and '@studiocms/ui'.
 * - Calls astro.dev() with the appropriate configuration to start the server.
 * - Catches and logs any errors that occur during the server startup process.
 *
 * Notes:
 * - The function produces side effects: launching server processes/listeners
 *   and modifying process.env.
 *
 * @async
 * @function serveUI
 * @returns {Promise<void>} Resolves when the Astro server has been started.
 * @throws {Error} If starting the Astro server fails (errors bubbled from astro.dev).
 */
async function serveUI() {
	const astro = await import('astro');
	const { default: node } = await import('@astrojs/node');
	const { default: ui } = await import('@studiocms/ui');

	const pkgRootPath = createPathResolver(import.meta.url).resolve('.');

	try {
		await astro.dev({
			root: pkgRootPath,
			output: 'server',
			configFile: false,
			logLevel: 'error',
			devToolbar: {
				enabled: false,
			},
			adapter: node({
				mode: 'standalone',
			}),
			integrations: [
				ui(),
				{
					name: 'studiocms-migrator-ui',
					hooks: {
						'astro:server:start': ({ address }) => {
							for (const line of [
								'🚀 StudioCMS Migrator UI is running!',
								`You can access it at: http://localhost:${address.port}`,
							]) {
								logger.info(line);
							}
						},
					},
				},
			],
		});
	} catch (error) {
		logger.error(
			`Error starting Astro server for StudioCMS Migrator UI: ${error instanceof Error ? error.message : String(error)}`
		);
		throw error;
	}
}

/**
 * Initialize the application runtime by loading configuration and starting the Astro server.
 *
 * This async function performs two sequential startup tasks:
 * 1. Loads the configuration file and applies any resulting environment variable settings.
 * 2. Loads and starts the Astro server.
 *
 * Both operations are awaited; the returned promise resolves once configuration has been applied
 * and the Astro server has been successfully started. Side effects include modification of
 * process.env and launching server processes/listeners.
 *
 * @async
 * @function start
 * @returns {Promise<void>} Resolves when configuration is loaded and the Astro server is started.
 * @throws {Error} If loading the configuration or starting the Astro server fails.
 */
export async function start() {
	logger.info('Starting StudioCMS Migrator...');
	dotenv.config({ quiet: true });
	await loadCMSConfigFile();
	await serveUI();
}

start().catch((error) => {
	logger.error(
		`Failed to start StudioCMS Migrator: ${error instanceof Error ? error.message : String(error)}`
	);
	process.exit(1);
});
