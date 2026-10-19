import { pathToFileURL } from 'node:url';
import { Effect } from 'effect';
import { getDbClient } from '../../db/index.js';
import type { StudioCMSConfig } from '../../schemas/index.js';
import type { BaseContext } from './context.js';
import { loadConfig } from './loadConfig.js';

/**
 * Retrieves a database client based on the StudioCMS configuration loaded from the given context.
 *
 * @param context - The CLI base context containing the current working directory.
 * @returns An Effect that resolves to the database client.
 */
const getRootUrl = (context: BaseContext) => Effect.sync(() => pathToFileURL(`${context.cwd}/`));

/**
 * Extracts the database dialect from the StudioCMS configuration.
 *
 * @param config - The loaded StudioCMS configuration.
 * @returns An Effect that resolves to the database dialect string.
 */
const extractDialect = (config: StudioCMSConfig) => Effect.sync(() => config.db.dialect);

/**
 * Retrieves the CLI database client using the provided context.
 *
 * @param context - The CLI base context containing the current working directory.
 * @returns An Effect that resolves to the database client.
 */
export const getCliDbClient = Effect.fn((context: BaseContext) =>
	getRootUrl(context).pipe(
		Effect.flatMap(loadConfig),
		Effect.flatMap(extractDialect),
		Effect.flatMap(getDbClient)
	)
);
