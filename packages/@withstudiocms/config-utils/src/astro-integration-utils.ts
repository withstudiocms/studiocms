import type { z } from 'astro/zod';
import { defineUtility } from 'astro-integration-kit';
import { loadConfigFile } from './loader.js';
import type { ConfigResolverBuilderOpts, WatchConfigFileOptions } from './types.js';
import { findConfig } from './watcher.js';
import { parseAndMerge, parseConfig } from './zod-utils.js';

/**
 * Builds a config resolver utility for Astro integrations.
 *
 * This function creates a utility that loads, validates, and merges configuration
 * from both inline options and config files, using a provided Zod schema for validation.
 * If both inline config and a config file are present, the config file takes precedence during merging.
 *
 * @template ConfigType - The shape of the configuration object.
 * @template Schema - The Zod schema type used for validation.
 * @param params - The configuration resolver options.
 * @param params.configPaths - Array of possible config file paths to search for.
 * @param params.label - A label used for logging.
 * @param params.zodSchema - The Zod schema used to validate and parse the config.
 * @returns A utility function to be used in the Astro config setup hook, which loads, validates, and merges configuration.
 */
export const configResolverBuilder = <S extends z.ZodTypeAny>({
	configPaths,
	label,
	zodSchema,
}: ConfigResolverBuilderOpts<S>) =>
	defineUtility('astro:config:setup')(
		async ({ logger: l, config: { root: astroRoot } }, options: S['_input']) => {
			let inlineConfig: S['_output'] = {} as S['_output'];

			// Generate a logger for the config resolver
			const logger = l.fork(`${label}:config`);

			// Check if inline options were provided
			const inlineConfigExists = options !== undefined;

			// If inline options are provided, parse them using the Zod schema
			if (zodSchema) {
				inlineConfig = parseConfig(zodSchema, options);
			}

			// Load the config file
			const loadedConfigFile = await loadConfigFile<S['_input']>(astroRoot, configPaths, label);

			// If no config file was found, return the inline config if it exists
			if (!loadedConfigFile) {
				logger.info('No config file found. Using inline config only.');
				return inlineConfig;
			}

			// If inline config exists, log a warning
			if (inlineConfigExists) {
				logger.warn(
					'Both an inline config and a config file were found. The config file will override the inline config during merging.'
				);
			}

			// Parse and merge the inline config with the loaded config file
			const mergedConfig = parseAndMerge(zodSchema, inlineConfig, loadedConfigFile);

			let logMessage = 'Config file loaded and merged successfully.';

			if (inlineConfigExists) {
				logMessage += ` Warning: Inline config will be overridden by the config file, if you face any issues, try migrating your config to only use the ${label} config file.`;
			}

			logger.info(logMessage);

			// Return the merged configuration object
			// This object will contain the final configuration, validated and merged from both sources
			return mergedConfig;
		}
	);

/**
 * Creates an Astro integration utility that watches for changes in the first existing configuration file
 * found in the provided `configPaths`. When a configuration file is detected, it is registered for watching
 * using Astro's `addWatchFile` mechanism.
 *
 * @param configPaths - An array of possible configuration file paths to check for existence.
 * @returns An Astro integration utility function for the `astro:config:setup` hook.
 */
export const watchConfigFileBuilder = ({ configPaths }: WatchConfigFileOptions) =>
	defineUtility('astro:config:setup')(
		({
			addWatchFile,
			config: {
				root: { pathname },
			},
		}) => {
			// Find the first existing configuration file from the provided paths
			// If a configuration file is found, register it for watching
			const configFileUrl = findConfig(pathname, configPaths);
			if (configFileUrl) {
				addWatchFile(configFileUrl);
			}
			return;
		}
	);
