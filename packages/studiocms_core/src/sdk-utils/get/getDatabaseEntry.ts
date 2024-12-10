/// <reference types="@astrojs/db" />
import { and, db, eq } from 'astro:db';
import { tsPageData, tsUsers } from '../../db/tsTables';
import type {
	CombinedPageData,
	CombinedUserData,
	DatabaseEntryTables,
	GetDatabaseEntry,
} from '../types';
import { collectPageData, collectUserData } from '../utils';

/**
 * Retrieves a database entry based on the specified table.
 *
 * @param database - The name of the database table to retrieve the entry from.
 * @returns An object containing methods to retrieve entries by different criteria.
 *
 * The function supports the following tables:
 * - 'users': Provides methods to retrieve user data by ID, username, or email.
 * - 'pages': Provides methods to retrieve page data by ID or slug and optionally package.
 *
 * @example
 * ```typescript
 * const userEntry = getDatabaseEntry('users');
 * const userData = await userEntry.byId('example-id');
 * if (userData) {
 *   console.log(userData);
 * } else {
 *   console.log('User not found');
 * }
 *
 * const pageEntry = getDatabaseEntry('pages');
 * const pageData = await pageEntry.byId('example-id');
 * if (pageData) {
 *   console.log(pageData);
 * } else {
 *   console.log('Page not found');
 * }
 * ```
 */
export function getDatabaseEntry(database: DatabaseEntryTables): GetDatabaseEntry {
	switch (database) {
		case 'users': {
			return {
				/**
				 * Retrieves a database entry by its ID.
				 *
				 * @param id - The ID of the user to retrieve.
				 * @returns A promise that resolves to the combined user data or undefined if no user is found.
				 *
				 * The function performs the following steps:
				 * 1. Retrieves the user data from the database using the provided ID.
				 * 2. If no user is found, returns undefined.
				 * 3. Retrieves OAuth account data and permissions data for the user.
				 * 4. Returns the combined user data including OAuth data and permissions data.
				 *
				 * @example
				 * ```typescript
				 * const userData = await byId('example-id');
				 * if (userData) {
				 *  console.log(userData);
				 * } else {
				 * console.log('User not found');
				 * }
				 * ```
				 */
				async byId(id: string): Promise<CombinedUserData | undefined> {
					const user = await db.select().from(tsUsers).where(eq(tsUsers.id, id)).get();

					if (!user) return undefined;

					return await collectUserData(user);
				},
				/**
				 * Retrieves a database entry by its username.
				 *
				 * @param username - The username of the user to retrieve.
				 * @returns A promise that resolves to the combined user data or undefined if no user is found.
				 *
				 * The function performs the following steps:
				 * 1. Retrieves the user data from the database using the provided username.
				 * 2. If no user is found, returns undefined.
				 * 3. Retrieves OAuth account data and permissions data for the user.
				 * 4. Returns the combined user data including OAuth data and permissions data.
				 *
				 * @example
				 * ```typescript
				 * const userData = await byUsername('john_doe');
				 * if (userData) {
				 * console.log(userData);
				 * } else {
				 * console.log('User not found');
				 * }
				 * ```
				 */
				async byUsername(username: string): Promise<CombinedUserData | undefined> {
					const user = await db.select().from(tsUsers).where(eq(tsUsers.username, username)).get();

					if (!user) return undefined;

					return await collectUserData(user);
				},
				/**
				 * Retrieves a database entry by its email.
				 *
				 * @param email - The email of the user to retrieve.
				 * @returns A promise that resolves to the combined user data or undefined if no user is found.
				 *
				 * The function performs the following steps:
				 * 1. Retrieves the user data from the database using the provided email.
				 * 2. If no user is found, returns undefined.
				 * 3. Retrieves OAuth account data and permissions data for the user.
				 * 4. Returns the combined user data including OAuth data and permissions data.
				 *
				 * @example
				 * ```typescript
				 * const userData = await byEmail('john@doe.xyz');
				 * if (userData) {
				 *  console.log(userData);
				 * } else {
				 * console.log('User not found');
				 * }
				 */
				async byEmail(email: string): Promise<CombinedUserData | undefined> {
					const user = await db.select().from(tsUsers).where(eq(tsUsers.email, email)).get();

					if (!user) return undefined;

					return await collectUserData(user);
				},
			};
		}
		case 'pages': {
			return {
				/**
				 * Retrieves a database entry by its ID.
				 *
				 * @param id - The ID of the page to retrieve.
				 * @returns A promise that resolves to the combined page data or undefined if no page is found.
				 *
				 * The function performs the following steps:
				 * 1. Retrieves the page data from the database using the provided ID.
				 * 2. If no page is found, returns undefined.
				 * 3. Initializes arrays for categories, tags, and contributors.
				 * 4. Retrieves all categories, tags, and users from the database.
				 * 5. Maps the category IDs, tag IDs, and contributor IDs from the page data to their respective data objects.
				 * 6. Retrieves multi-language content data for the page.
				 * 7. Finds the default content data from the multi-language content data.
				 * 8. Returns the combined page data including categories, tags, contributors, multi-language content, and default content.
				 *
				 * @example
				 * ```typescript
				 * const pageData = await byId('example-id');
				 * if (pageData) {
				 *  console.log(pageData);
				 * } else {
				 * console.log('Page not found');
				 * }
				 * ```
				 */
				async byId(id: string): Promise<CombinedPageData | undefined> {
					const page = await db.select().from(tsPageData).where(eq(tsPageData.id, id)).get();

					if (!page) return undefined;

					return await collectPageData(page);
				},
				/**
				 * Retrieves a database entry by its slug and optional package name.
				 *
				 * @param slug - The slug of the page to retrieve.
				 * @param pkg - Optional package name to filter the page by. Defaults to 'studiocms'.
				 * @returns A promise that resolves to the combined page data or undefined if no page is found.
				 *
				 * The function performs the following steps:
				 * 1. Retrieves the page data from the database using the provided slug and package name.
				 * 2. If no page is found, returns undefined.
				 * 3. Initializes arrays for categories, tags, and contributors.
				 * 4. Retrieves all categories, tags, and users from the database.
				 * 5. Maps the category IDs, tag IDs, and contributor IDs from the page data to their respective data objects.
				 * 6. Retrieves multi-language content data for the page.
				 * 7. Finds the default content data from the multi-language content data.
				 * 8. Returns the combined page data including categories, tags, contributors, multi-language content, and default content.
				 *
				 * @example
				 * ```typescript
				 * const pageData = await bySlug('example-slug');
				 * if (pageData) {
				 *   console.log(pageData);
				 * } else {
				 *   console.log('Page not found');
				 * }
				 * ```
				 */
				async bySlug(slug: string, pkg?: string): Promise<CombinedPageData | undefined> {
					const pkgToGet = pkg || 'studiocms';

					const page = await db
						.select()
						.from(tsPageData)
						.where(and(eq(tsPageData.slug, slug), eq(tsPageData.package, pkgToGet)))
						.get();

					if (!page) return undefined;

					return await collectPageData(page);
				},
			};
		}
	}
}

export default getDatabaseEntry;
