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
	tsSessionTable,
	tsSiteConfig,
	tsUsers,
} from '../db/tsTables';
import type {
	CombinedPageData,
	CombinedUserData,
	CurrentTables,
	SimplifiedTables,
	tsPageDataCategoriesSelect,
	tsPageDataTagsSelect,
} from './types';

export async function getDatabaseRaw(database: CurrentTables) {
	switch (database) {
		case 'users': {
			const users = await db.select().from(tsUsers);
			return users;
		}
		case 'oAuthAccounts': {
			const oAuthAccounts = await db.select().from(tsOAuthAccounts);
			return oAuthAccounts;
		}
		case 'sessionTable': {
			const sessionTable = await db.select().from(tsSessionTable);
			return sessionTable;
		}
		case 'permissions': {
			const permissions = await db.select().from(tsPermissions);
			return permissions;
		}
		case 'pageData': {
			const pageData = await db.select().from(tsPageData);
			return pageData;
		}
		case 'pageDataTags': {
			const pageDataTags = await db.select().from(tsPageDataTags);
			return pageDataTags;
		}
		case 'pageDataCategories': {
			const pageDataCategories = await db.select().from(tsPageDataCategories);
			return pageDataCategories;
		}
		case 'pageContent': {
			const pageContent = await db.select().from(tsPageContent);
			return pageContent;
		}
		case 'siteConfig': {
			const siteConfig = await db
				.select()
				.from(tsSiteConfig)
				.where(eq(tsSiteConfig.id, CMSSiteConfigId))
				.get();
			return siteConfig;
		}
	}
}

export async function getDatabase(database: SimplifiedTables) {
	switch (database) {
		case 'users': {
			const combinedUserData: CombinedUserData[] = [];

			const users = await db.select().from(tsUsers);

			for (const user of users) {
				const oAuthData = await db
					.select()
					.from(tsOAuthAccounts)
					.where(eq(tsOAuthAccounts.userId, user.id))
					.get();

				const sessionData = await db
					.select()
					.from(tsSessionTable)
					.where(eq(tsSessionTable.userId, user.id))
					.get();

				const permissionsData = await db
					.select()
					.from(tsPermissions)
					.where(eq(tsPermissions.user, user.id))
					.get();

				const UserData: CombinedUserData = {
					...user,
					oAuthData: oAuthData,
					sessionData: sessionData,
					permissionsData: permissionsData,
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

				for (const category of page.catagories as number[]) {
					const categoryData = await db
						.select()
						.from(tsPageDataCategories)
						.where(eq(tsPageDataCategories.id, category))
						.get();
					if (categoryData) {
						categories.push(categoryData);
					}
				}

				for (const tag of page.tags as number[]) {
					const tagData = await db
						.select()
						.from(tsPageDataTags)
						.where(eq(tsPageDataTags.id, tag))
						.get();
					if (tagData) {
						tags.push(tagData);
					}
				}

				const contentData = await db
					.select()
					.from(tsPageContent)
					.where(eq(tsPageContent.contentId, page.id));

				const PageData: CombinedPageData = {
					...page,
					categories: categories,
					tags: tags,
					content: contentData,
				};

				pages.push(PageData);
			}

			return pages;
		}
		case 'config': {
			const siteConfig = await db
				.select()
				.from(tsSiteConfig)
				.where(eq(tsSiteConfig.id, CMSSiteConfigId))
				.get();
			return siteConfig;
		}
	}
}
