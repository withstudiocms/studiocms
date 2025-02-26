import { dbSecret, dbUrl } from 'virtual:studiocms/sdk/env';
import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../tables.js';

/**
 * Returns a new Drizzle libSQL connection.
 */
export const useDB = () => {
	const client = createClient({
		url: dbUrl,
		authToken: dbSecret,
	});
	const db = drizzle(client, { schema });

	return db;
};
