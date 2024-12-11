import { db, eq } from 'astro:db';
import {
	tsPageContent,
	tsPageData,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
	tsSiteConfig,
} from '../tables';
import type { STUDIOCMS_SDK } from '../types';

/**
 * The `StudioCMS_SDK_UPDATE` object provides methods to update various entities in the StudioCMS system.
 * Each method performs an update operation on a specific table and returns the updated record.
 *
 * @property {Function} page - Updates a page record in the `tsPageData` table.
 * @property {Function} pageContent - Updates a page content record in the `tsPageContent` table.
 * @property {Function} tags - Updates a tag record in the `tsPageDataTags` table.
 * @property {Function} categories - Updates a category record in the `tsPageDataCategories` table.
 * @property {Function} permissions - Updates a permission record in the `tsPermissions` table.
 * @property {Function} siteConfig - Updates a site configuration record in the `tsSiteConfig` table.
 *
 * Each method accepts a `data` parameter which contains the fields to be updated and the identifier of the record to be updated.
 * The methods use the `db.update` function to perform the update operation, and the `returning().get()` chain to return the updated record.
 */
export const StudioCMS_SDK_UPDATE: STUDIOCMS_SDK['UPDATE'] = {
	page: async (data) => {
		return await db
			.update(tsPageData)
			.set(data)
			.where(eq(tsPageData.id, data.id))
			.returning()
			.get();
	},
	pageContent: async (data) => {
		return await db
			.update(tsPageContent)
			.set(data)
			.where(eq(tsPageContent.id, data.id))
			.returning()
			.get();
	},
	tags: async (data) => {
		return await db
			.update(tsPageDataTags)
			.set(data)
			.where(eq(tsPageDataTags.id, data.id))
			.returning()
			.get();
	},
	categories: async (data) => {
		return await db
			.update(tsPageDataCategories)
			.set(data)
			.where(eq(tsPageDataCategories.id, data.id))
			.returning()
			.get();
	},
	permissions: async (data) => {
		return await db
			.update(tsPermissions)
			.set(data)
			.where(eq(tsPermissions.user, data.user))
			.returning()
			.get();
	},
	siteConfig: async (data) => {
		return await db
			.update(tsSiteConfig)
			.set(data)
			.where(eq(tsSiteConfig.id, data.id))
			.returning()
			.get();
	},
};

export default StudioCMS_SDK_UPDATE;
