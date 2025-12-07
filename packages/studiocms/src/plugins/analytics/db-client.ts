import type { DbDialectType } from '#db/index';
import { getDbPluginClient } from '#db/plugins';
import type { StudioCMSMetricDB } from './table.js';

export const getAnalyticsDbClient = (driverDialect: DbDialectType) => {
	const dbClient = getDbPluginClient<StudioCMSMetricDB>(driverDialect);
	return dbClient;
};
