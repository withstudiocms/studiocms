/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import { CMSSiteConfigId } from '../consts';
import {
	tsOAuthAccounts,
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
	tsSiteConfig,
	tsUsers,
} from '../db/tsTables';
import type {
	CombinedPageData,
	CombinedUserData,
	SimplifiedTables,
	tsPageDataCategoriesSelect,
	tsPageDataTagsSelect,
} from './types';

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
				const [oAuthData, permissionData] = await db.batch([
					db.select().from(tsOAuthAccounts).where(eq(tsOAuthAccounts.userId, user.id)),
					db.select().from(tsPermissions).where(eq(tsPermissions.user, user.id)),
				]);

				const UserData: CombinedUserData = {
					...user,
					oAuthData: oAuthData,
					permissionsData: permissionData.pop(),
				};

				combinedUserData.push(UserData);
			}

			return combinedUserData;
		}
		case 'pages': {
			const pages: CombinedPageData[] = [];

			const pageData = await db.select().from(tsPageData);

			for (const page of pageData) {
				const categories: tsPageDataCategoriesSelect[] = [];
				const tags: tsPageDataTagsSelect[] = [];
				const contributors: string[] = [];

				const [allCategories, allTags, allUsers] = await db.batch([
					db.select().from(tsPageDataCategories),
					db.select().from(tsPageDataTags),
					db.select().from(tsUsers),
				]);

				for (const category of page.categories as number[]) {
					const categoryData = allCategories.find((cat) => cat.id === category);
					if (categoryData) {
						categories.push(categoryData);
					}
				}

				for (const tag of page.tags as number[]) {
					const tagData = allTags.find((t) => t.id === tag);
					if (tagData) {
						tags.push(tagData);
					}
				}

				for (const contributor of page.contributorIds as string[]) {
					const contributorData = allUsers.find((user) => user.id === contributor);
					if (contributorData) {
						contributors.push(contributorData.id);
					}
				}

				const contentData = await db
					.select()
					.from(tsPageContent)
					.where(eq(tsPageContent.contentId, page.id));

				const PageData: CombinedPageData = {
					...page,
					contributorIds: contributors,
					categories: categories,
					tags: tags,
					content: contentData,
				};

				pages.push(PageData);
			}

			return pages;
		}
		case 'config':
			return await db.select().from(tsSiteConfig).where(eq(tsSiteConfig.id, CMSSiteConfigId)).get();
		default:
			throw new Error(`Database table '${database}' not recognized.`);
	}
}
