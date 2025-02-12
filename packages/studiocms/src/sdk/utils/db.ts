import { dbSecret, dbUrl } from 'virtual:studiocms/sdk/env';
import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';

const client = createClient({
	url: dbUrl,
	authToken: dbSecret,
});

/**
 * Returns a new Drizzle libSQL connection.
 */
export const useDB = () => {
	const connection = drizzle(client);

	return connection;
};
