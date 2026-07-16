import fs from 'node:fs';
import type { HookParameters } from 'astro';
import { Schema } from 'effect';
import { loadConfigFile } from './loader.js';
import type { ConfigResolverBuilderEffectOpts, WatchConfigFileOptions } from './types.js';
import { findConfig } from './watcher.js';

/* v8 ignore start */
/**
 * Builds an effect-based config resolver utility for Astro integrations.
 *
 * This function creates a utility that loads a configuration file and processes it through an effect-based schema.
 * If a configuration file is found, it is loaded and passed to the provided effect schema for processing.
 * If no configuration file is found, the effect schema is executed with an empty object as input.
 *
 * @template A - The type of the configuration object that will be produced by the effect.
 * @template I - The type of the input to the effect that produces the configuration object.
 * @param params - The configuration resolver options for effect-based processing.
 * @param params.configPaths - Array of possible config file paths to search for.
 * @param params.label - A label used for logging.
 * @param params.effectSchema - The schema for the effect that will produce the configuration object.
 * @returns A utility function to be used in the Astro config setup hook, which loads a config file and processes it through an effect-based schema.
 */
export const configResolverBuilder =
	<A, I>({ configPaths, label, effectSchema }: ConfigResolverBuilderEffectOpts<A, I>) =>
	async ({ logger: l, config: { root: astroRoot } }: HookParameters<'astro:config:setup'>) => {
		// Generate a logger for the config resolver
		const logger = l.fork(`${label}:config`);

		// Load the config file
		const loadedViteConfigFile = await loadConfigFile({ configPaths, root: astroRoot, fs });

		// If no config file is found, log a message and return the default configuration using the effect schema
    if (Object.keys(loadedViteConfigFile).length === 0) {
			logger.info('No config entries found. Using default configuration.');
			return await Schema.decodeUnknownPromise(effectSchema)({});
		}

		// Parse the loaded config file using the provided effect schema
		const parsedConfig = await Schema.decodeUnknownPromise(effectSchema)(loadedViteConfigFile);

		// Log a message indicating that the config file was loaded and parsed successfully
		logger.info('Config file loaded and parsed successfully.');

		// Return the parsed configuration object
		return parsedConfig;
	};

/**
 * Builds an effect-based config resolver utility for Astro integrations.
 *
 * This function creates a utility that loads a configuration file and processes it through an effect-based schema.
 * If a configuration file is found, it is loaded and passed to the provided effect schema for processing.
 * If no configuration file is found, the effect schema is executed with an empty object as input.
 *
 * @template A - The type of the configuration object that will be produced by the effect.
 * @template I - The type of the input to the effect that produces the configuration object.
 * @param params - The configuration resolver options for effect-based processing.
 * @param params.configPaths - Array of possible config file paths to search for.
 * @param params.label - A label used for logging.
 * @param params.effectSchema - The schema for the effect that will produce the configuration object.
 * @returns A utility function to be used in the Astro config setup hook, which loads a config file and processes it through an effect-based schema.
 * @deprecated This function is deprecated in favor of `configResolverBuilder`, which provides the same functionality without relying on effects. The effect-based approach is no longer necessary and has been removed to simplify the codebase.
 */
export const configResolverBuilderEffect = configResolverBuilder;
/* v8 ignore stop */

/* v8 ignore start */
// This function is tested indirectly via the integration tests in this package
/**
 * Creates an Astro integration utility that watches for changes in the first existing configuration file
 * found in the provided `configPaths`. When a configuration file is detected, it is registered for watching
 * using Astro's `addWatchFile` mechanism.
 *
 * @param configPaths - An array of possible configuration file paths to check for existence.
 * @returns An Astro integration utility function for the `astro:config:setup` hook.
 */
export const watchConfigFileBuilder =
	({ configPaths, _test_report }: WatchConfigFileOptions) =>
	({
		config: {
			root: { pathname },
		},
		addWatchFile,
	}: HookParameters<'astro:config:setup'>) => {
		// Find the first existing configuration file from the provided paths
		// If a configuration file is found, register it for watching
		const configFileUrl = findConfig(pathname, configPaths);
		if (configFileUrl) {
			try {
				addWatchFile(configFileUrl);
				_test_report?.logs.push(configFileUrl);
			} catch (error) {
				_test_report?.errors.push(`Error watching config file: ${error}`);
			}
		}
		return;
	};
/* v8 ignore stop */
