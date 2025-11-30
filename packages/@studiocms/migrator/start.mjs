#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { loadConfigFile, parseAndMerge } from '@withstudiocms/config-utils';
import dotenv from 'dotenv';
import { configPaths } from 'studiocms/consts';
import { StudioCMSOptionsSchema } from 'studiocms/schemas';

// Load environment variables from .env file
dotenv.config({ quiet: true });

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
	// Determine the root path of the project
	const rootPath = pathToFileURL(`${process.cwd()}/`);

	// Load StudioCMS Config file
	const configFile = await loadConfigFile(rootPath, configPaths, 'db-migrator-util');

	// Log whether the config file was found
	if (configFile) {
		console.log('Loaded StudioCMS config file successfully.');
	} else {
		console.log('No StudioCMS config file found, using default configuration.');
	}

	// Get the minimal default configuration
	const defaultConfig = StudioCMSOptionsSchema.parse({});

	// Merge user config with default config
	const userConfig = parseAndMerge(StudioCMSOptionsSchema, defaultConfig, configFile);

	// Set custom environment variables based on user config
	const customENV = { STUDIOCMS_DIALECT: userConfig.db.dialect };

	// Populate process.env with custom environment variables
	dotenv.populate(process.env, customENV, { quiet: true });
}

/**
 * Asynchronously loads the Astro server entry module via a dynamic import.
 *
 * This delays loading of the server code until runtime, which can reduce
 * startup overhead and avoid early ESM evaluation or circular import issues.
 * The imported module is returned as-is; subsequent calls will typically
 * resolve to the cached module instance provided by the ESM loader.
 *
 * @async
 * @function loadAstroServer
 * @returns {Promise<import('./dist/server/entry.mjs')>} A promise that resolves to the imported Astro server entry module.
 * @throws {Error} If the dynamic import fails (e.g., file not found or module resolution error).
 */
async function loadAstroServer() {
	// Dynamically import the Astro server entry point
	return await import('./dist/server/entry.mjs');
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
	// Load configuration file and set environment variables
	await loadCMSConfigFile();
	// Load and start the Astro server
	await loadAstroServer();
}

start().catch((error) => {
	console.error('Error starting the migrator server:', error);
	process.exit(1);
});
