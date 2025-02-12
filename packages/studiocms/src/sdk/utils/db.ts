import { dbSecret, dbUrl } from 'virtual:studiocms/sdk/env';
// import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql/node';

// const client = createClient({
// 	url: dbUrl,
// 	authToken: dbSecret,
// });

/**
 * Returns a new Drizzle libSQL connection.
 */
export const useDB = () => {
	const connection = drizzle({
		connection: {
			url: dbUrl,
			authToken: dbSecret,
		},
	});

	return connection;
};
