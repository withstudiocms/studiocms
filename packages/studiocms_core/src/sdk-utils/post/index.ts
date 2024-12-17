import type { STUDIOCMS_SDK_POST } from '../types';
import { postDatabaseEntries } from './postDatabaseEntries';
import { postDatabaseEntry } from './postDatabaseEntry';

export { postDatabaseEntry, postDatabaseEntries };

/**
 * Contains methods for adding data to the database.
 */
export const studioCMS_SDK_POST: STUDIOCMS_SDK_POST = {
	databaseEntry: postDatabaseEntry,
	databaseEntries: postDatabaseEntries,
};

export default studioCMS_SDK_POST;
