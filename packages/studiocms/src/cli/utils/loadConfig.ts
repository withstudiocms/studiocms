import {
	loadConfigFile as _loadConfigFile,
	parseAndMerge as _parseAndMerge,
} from '@withstudiocms/config-utils';
import { Effect } from 'effect';
import { configPaths } from '../../consts.js';
import { type StudioCMSOptions, StudioCMSOptionsSchema } from '../../schemas/index.js';

/**
 * Loads the StudioCMS configuration file from the specified root directory.
 *
 * @param root - The root directory URL where the configuration file is located.
 * @returns An Effect that resolves to the loaded StudioCMSOptions or undefined if no config file is found.
 */
const loadConfigFile = Effect.fn((root: URL) =>
	Effect.tryPromise(() => _loadConfigFile<StudioCMSOptions>(root, configPaths, 'migrator'))
);

/**
 * Parses and merges the StudioCMS configuration using the provided config object.
 *
 * @param config - The configuration object to parse and merge.
 * @returns An Effect that resolves to the merged StudioCMSOptions.
 */
const parseAndMerge = Effect.fn((config: StudioCMSOptions | undefined) =>
	Effect.try(() => _parseAndMerge(StudioCMSOptionsSchema, config))
);

/**
 * Loads and merges the StudioCMS configuration from the specified root directory.
 *
 * @param root - The root directory URL where the configuration file is located.
 * @returns An Effect that resolves to the merged StudioCMSOptions.
 */
export const loadConfig = (root: URL) => loadConfigFile(root).pipe(Effect.flatMap(parseAndMerge));
