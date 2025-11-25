import {
	loadConfigFile as _loadConfigFile,
	parseAndMerge as _parseAndMerge,
} from '@withstudiocms/config-utils';
import { Effect } from 'effect';
import { configPaths } from '../../../consts.js';
import { type StudioCMSOptions, StudioCMSOptionsSchema } from '../../../schemas/index.js';

const loadConfigFile = Effect.fn((root: URL) =>
	Effect.tryPromise(() => _loadConfigFile<StudioCMSOptions>(root, configPaths, 'migrator'))
);

const parseAndMerge = Effect.fn((config: StudioCMSOptions) =>
	Effect.try(() => _parseAndMerge(StudioCMSOptionsSchema, undefined, config))
);

export const loadConfig = (root: URL) => loadConfigFile(root).pipe(Effect.flatMap(parseAndMerge));
