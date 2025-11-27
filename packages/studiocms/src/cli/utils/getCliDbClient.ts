import { pathToFileURL } from 'node:url';
import { Effect } from 'effect';
import { getDbClient } from '../../db/index.js';
import type { StudioCMSConfig } from '../../schemas/index.js';
import type { BaseContext } from './context.js';
import { loadConfig } from './loadConfig.js';

const getRootUrl = (context: BaseContext) => Effect.sync(() => pathToFileURL(`${context.cwd}/`));

const extractDialect = (config: StudioCMSConfig) => Effect.sync(() => config.db.dialect);

export const getCliDbClient = Effect.fn((context: BaseContext) =>
	getRootUrl(context).pipe(
		Effect.flatMap(loadConfig),
		Effect.flatMap(extractDialect),
		Effect.flatMap(getDbClient)
	)
);
