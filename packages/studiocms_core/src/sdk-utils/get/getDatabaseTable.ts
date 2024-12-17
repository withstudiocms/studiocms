/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import { CMSSiteConfigId } from '../../consts';
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
} from '../tables';
import type { STUDIOCMS_SDK_GET } from '../types';

/**
 * Retrieves various database tables
 *
 * @property {Function} users - Fetches the users table.
 * @property {Function} oAuthAccounts - Fetches the OAuth accounts table.
 * @property {Function} sessionTable - Fetches the session table.
 * @property {Function} permissions - Fetches the permissions table.
 * @property {Function} pageData - Fetches the page data table.
 * @property {Function} pageDataTags - Fetches the page data tags table.
 * @property {Function} pageDataCategories - Fetches the page data categories table.
 * @property {Function} pageContent - Fetches the page content table.
 * @property {Function} siteConfig - Fetches the site configuration table with a specific site config ID.
 * @property {Function} diffTracking - Fetches the diff tracking table.
 */
export const getDatabaseTable: STUDIOCMS_SDK_GET['databaseTable'] = {
	users: async () => await db.select().from(tsUsers),
	oAuthAccounts: async () => await db.select().from(tsOAuthAccounts),
	sessionTable: async () => await db.select().from(tsSessionTable),
	permissions: async () => await db.select().from(tsPermissions),
	pageData: async () => await db.select().from(tsPageData),
	pageDataTags: async () => await db.select().from(tsPageDataTags),
	pageDataCategories: async () => await db.select().from(tsPageDataCategories),
	pageContent: async () => await db.select().from(tsPageContent),
	siteConfig: async () =>
		await db.select().from(tsSiteConfig).where(eq(tsSiteConfig.id, CMSSiteConfigId)).get(),
	diffTracking: async () => await db.select().from(tsDiffTracking),
};

export default getDatabaseTable;
