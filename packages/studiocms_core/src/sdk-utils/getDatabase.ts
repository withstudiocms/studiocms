/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import { CMSSiteConfigId } from '../consts';
import { tsPageData, tsSiteConfig, tsUsers } from '../db/tsTables';
import type { CombinedPageData, CombinedUserData, SimplifiedTables } from './types';
import { collectPageData, collectUserData } from './utils';

/**
 * Retrieves data from the database based on the specified table.
 *
 * @param database - The name of the database table to retrieve data from.
 *                   It can be one of the following values: 'users', 'pages', or 'config'.
 *
 * @returns A promise that resolves to the data retrieved from the specified table.
 *
 * - If `database` is 'users', it returns an array of `CombinedUserData` objects.
 * - If `database` is 'pages', it returns an array of `CombinedPageData` objects.
 * - If `database` is 'config', it returns the site configuration object.
 *
 * @throws Will throw an error if the specified database table is not recognized.
 */
export async function getDatabase(database: SimplifiedTables) {
	switch (database) {
		case 'users': {
			const combinedUserData: CombinedUserData[] = [];

			const users = await db.select().from(tsUsers);

			for (const user of users) {
				const UserData = await collectUserData(user);

				combinedUserData.push(UserData);
			}

			return combinedUserData;
		}
		case 'pages': {
			const pages: CombinedPageData[] = [];

			const pagesRaw = await db.select().from(tsPageData);

			for (const page of pagesRaw) {
				const PageData = await collectPageData(page);

				pages.push(PageData);
			}

			return pages;
		}
		case 'config': {
			return await db.select().from(tsSiteConfig).where(eq(tsSiteConfig.id, CMSSiteConfigId)).get();
		}
		default:
			throw new Error(`Database table '${database}' not recognized.`);
	}
}
