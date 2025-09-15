import { createClient } from '@libsql/client';
import { drizzleDBClientLive, LibSQLClientError } from '@withstudiocms/effect/drizzle';
import { drizzle } from 'drizzle-orm/libsql';
import * as s from 'drizzle-orm/sqlite-core';
import { Effect } from 'effect';

export { LibSQLClientError } from '@withstudiocms/effect/drizzle';

export const Users = s.sqliteTable('StudioCMSUsers', {
	id: s.text('id').primaryKey(),
	url: s.text('url'),
	name: s.text('name').notNull(),
	email: s.text('email').unique(),
	avatar: s.text('avatar').default('https://seccdn.libravatar.org/static/img/mm/80.png'),
	username: s.text('username').notNull(),
	password: s.text('password'),
	updatedAt: s.integer('updatedAt', { mode: 'timestamp' }),
	createdAt: s.integer('createdAt', { mode: 'timestamp' }),
	emailVerified: s.integer('emailVerified', { mode: 'boolean' }).default(false).notNull(),
	notifications: s.text('notifications'),
});

export const Permissions = s.sqliteTable('StudioCMSPermissions', {
	user: s
		.text('user')
		.references(() => Users.id)
		.notNull(),
	rank: s.text('rank', { enum: ['owner', 'admin', 'editor', 'visitor', 'unknown'] }).notNull(),
});

const useWithError = <A>(_try: () => A) =>
	Effect.try({
		try: _try,
		catch: (cause) => new LibSQLClientError({ cause }),
	});

/**
 * Creates a Drizzle client for a LibSQL database and provides utility functions for executing queries.
 *
 * @param url - The URL of the LibSQL database.
 * @param authToken - The authentication token for the LibSQL database.
 * @returns An object containing:
 *   - `execute`: A function to execute a query with error handling, wrapping the result in an Effect.
 *   - `makeQuery`: A higher-order function to create typed query functions that can optionally use a transaction context.
 *
 * @example
 * const { execute, makeQuery } = yield* libSQLDrizzleClient(url, authToken);
 * const result = yield* execute((db) => db.select(...));
 */
export const libSQLDrizzleClient = Effect.fn(function* (url: string, authToken: string) {
	const client = yield* useWithError(() => createClient({ url, authToken }));
	const db = yield* useWithError(() => drizzle(client));

	const { execute, makeQuery } = yield* drizzleDBClientLive({
		drizzle: db,
		schema: {
			StudioCMSUsers: Users,
			StudioCMSPermissions: Permissions,
		},
	});

	return { execute, makeQuery };
});
