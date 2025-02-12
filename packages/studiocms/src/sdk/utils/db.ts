import { dbSecret, dbUrl } from 'virtual:studiocms/sdk/env';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

/**
 * Returns a new Drizzle libSQL connection.
 */
export const useDB = () => {
	const client = createClient({
		url: dbUrl,
		authToken: dbSecret,
	});

	const connection = drizzle(client);

	return connection;
};
