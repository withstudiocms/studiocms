/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import { CMSSiteConfigId } from '../../consts';
import { tsPageData, tsSiteConfig, tsUsers } from '../tables';
import type { CombinedPageData, CombinedUserData, STUDIOCMS_SDK_GET, SiteConfig } from '../types';
import { collectPageData, collectUserData, handleSDKError } from '../utils';

/**
 * Provides methods to retrieve various types of data from the database.
 *
 * @type {STUDIOCMS_SDK['GET']['database']}
 *
 * @property {Function} users - Asynchronously retrieves and combines user data from the database.
 * @property {Function} pages - Asynchronously retrieves and combines page data from the database.
 * @property {Function} config - Asynchronously retrieves the site configuration from the database.
 */
export const getDatabase: STUDIOCMS_SDK_GET['database'] = {
	users: async () => {
		try {
			const combinedUserData: CombinedUserData[] = [];

			const users = await db.select().from(tsUsers);

			for (const user of users) {
				const UserData = await collectUserData(user);

				combinedUserData.push(UserData);
			}

			return combinedUserData;
		} catch (error) {
			handleSDKError(error, 'Error getting users: An unknown error occurred.');
		}
	},
	pages: async () => {
		try {
			const pages: CombinedPageData[] = [];

			const pagesRaw = await db.select().from(tsPageData);

			for (const page of pagesRaw) {
				const PageData = await collectPageData(page);

				pages.push(PageData);
			}

			return pages;
		} catch (error) {
			handleSDKError(error, 'Error getting pages: An unknown error occurred.');
		}
	},
	config: async () => {
		try {
			const siteConfig = await db
				.select()
				.from(tsSiteConfig)
				.where(eq(tsSiteConfig.id, CMSSiteConfigId))
				.get();

			if (!siteConfig) return undefined;

			return siteConfig as SiteConfig;
		} catch (error) {
			handleSDKError(error, 'Error getting site configuration: An unknown error occurred.');
		}
	},
};

export default getDatabase;
