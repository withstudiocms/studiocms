import type { STUDIOCMS_SDK_GET } from '../types';
import getDatabase from './getDatabase';
import getDatabaseEntry from './getDatabaseEntry';
import getDatabaseTable from './getDatabaseTable';
import getPackagePages from './getPackagePages';
import getPermissionsLists from './getPermissionLists';

export { getDatabase, getDatabaseEntry, getDatabaseTable, getPackagePages, getPermissionsLists };

/**
 * Contains methods for getting data from the database.
 */
export const studioCMS_SDK_GET: STUDIOCMS_SDK_GET = {
	database: getDatabase,
	databaseEntry: getDatabaseEntry,
	databaseTable: getDatabaseTable,
	permissionsLists: getPermissionsLists,
	packagePages: async (packageName) => await getPackagePages(packageName),
};

export default studioCMS_SDK_GET;
