import type { STUDIOCMS_SDK } from '../types';
import { postDatabaseEntry } from './postDatabaseEntry';

export { postDatabaseEntry };

export const StudioCMS_SDK_POST: STUDIOCMS_SDK['POST'] = {
	databaseEntry: postDatabaseEntry,
	databaseEntries: {},
};

export default StudioCMS_SDK_POST;
