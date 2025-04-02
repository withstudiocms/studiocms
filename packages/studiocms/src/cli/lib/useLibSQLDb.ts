import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../../sdk/tables.js';

/**
 * Returns a new Drizzle libSQL connection.
 */
export const useLibSQLDb = (url: string, authToken: string) => {
	try {
		const client = createClient({ url, authToken });
		const db = drizzle(client, { schema });

		return db;
	} catch (error) {
		console.error('Failed to connect to libSQL database:', error);
		throw new Error('Database connection failed. Please check your credentials and try again.');
	}
};

const { tsUsers, tsPermissions } = schema;

export { tsUsers, tsPermissions };
