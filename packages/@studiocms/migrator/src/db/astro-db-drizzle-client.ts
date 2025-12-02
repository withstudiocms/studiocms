/** biome-ignore-all lint/style/noNonNullAssertion: This is okay */
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './drizzle-schema.js';

const client = createClient({
	url: process.env.ASTRO_DB_REMOTE_URL!,
	authToken: process.env.ASTRO_DB_APP_TOKEN!,
});

export const db = drizzle({ client, schema });

export * from '../lib/astro-db-drizzle-compat/virtual.js';
export * from './drizzle-schema.js';
