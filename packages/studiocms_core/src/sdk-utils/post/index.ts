import type { STUDIOCMS_SDK } from '../types';
import { postDatabaseEntries } from './postDatabaseEntries';
import { postDatabaseEntry } from './postDatabaseEntry';

export { postDatabaseEntry, postDatabaseEntries };

/**
 * Contains methods for adding data to the database.
 */
export const StudioCMS_SDK_POST: STUDIOCMS_SDK['POST'] = {
	databaseEntry: postDatabaseEntry,
	databaseEntries: postDatabaseEntries,
};

export default StudioCMS_SDK_POST;
