import type { DbDialectType } from '#db/index';
import { getDbPluginClient } from '#db/plugins';
import type { StudioCMSMetricDB } from './table.js';

/**
 * Retrieves a database client for the Analytics plugin.
 *
 * @param driverDialect - The database dialect type.
 * @returns A database client configured for the StudioCMSMetricDB schema.
 */
export const getAnalyticsDbClient = (driverDialect: DbDialectType) => {
	const dbClient = getDbPluginClient<StudioCMSMetricDB>(driverDialect);
	return dbClient;
};
