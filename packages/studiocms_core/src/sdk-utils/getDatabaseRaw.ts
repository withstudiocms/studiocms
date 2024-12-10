/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import { CMSSiteConfigId } from '../consts';
import {
	tsDiffTracking,
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
	tsSessionTable,
	tsSiteConfig,
	tsUsers,
} from '../db/tsTables';
import type { CurrentTables } from './types';

/**
 * Retrieves raw data from the specified database table.
 *
 * @param database - The name of the database table to retrieve data from.
 * @returns A promise that resolves to the data from the specified database table.
 * @throws An error if the specified database table is unknown.
 *
 * @example
 * ```typescript
 * const users = await getDatabaseRaw('users');
 * console.log(users);
 * ```
 */
export async function getDatabaseRaw(database: CurrentTables) {
	switch (database) {
		case 'users':
			return await db.select().from(tsUsers);
		case 'oAuthAccounts':
			return await db.select().from(tsOAuthAccounts);
		case 'sessionTable':
			return await db.select().from(tsSessionTable);
		case 'permissions':
			return await db.select().from(tsPermissions);
		case 'pageData':
			return await db.select().from(tsPageData);
		case 'pageDataTags':
			return await db.select().from(tsPageDataTags);
		case 'pageDataCategories':
			return await db.select().from(tsPageDataCategories);
		case 'pageContent':
			return await db.select().from(tsPageContent);
		case 'siteConfig':
			return await db.select().from(tsSiteConfig).where(eq(tsSiteConfig.id, CMSSiteConfigId)).get();
		case 'diffTracking':
			return await db.select().from(tsDiffTracking);
		default:
			throw new Error(`Unknown database table: ${database}`);
	}
}
