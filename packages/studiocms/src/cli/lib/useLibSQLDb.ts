import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as s from 'drizzle-orm/sqlite-core';

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
	rank: s.text('rank').notNull(),
});

/**
 * Returns a new Drizzle libSQL connection.
 */
export const useLibSQLDb = (url: string, authToken: string) => {
	try {
		const client = createClient({ url, authToken });
		const db = drizzle(client, {
			schema: {
				StudioCMSUsers: Users,
				StudioCMSPermissions: Permissions,
			},
		});

		return db;
	} catch (error) {
		console.error('Failed to connect to libSQL database:', error);
		throw new Error('Database connection failed. Please check your credentials and try again.');
	}
};
