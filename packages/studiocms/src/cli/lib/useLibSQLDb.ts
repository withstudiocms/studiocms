import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../../sdk/tables.js';

/**
 * Returns a new Drizzle libSQL connection.
 */
export const useLibSQLDb = (url: string, authToken: string) => {
	const client = createClient({ url, authToken });
	const db = drizzle(client, { schema });

	return db;
};

export { schema as tables };
