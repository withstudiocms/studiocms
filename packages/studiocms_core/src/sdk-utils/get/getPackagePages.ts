/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import { tsPageData } from '../tables';
import type { CombinedPageData, STUDIOCMS_SDK_GET } from '../types';
import { StudioCMS_SDK_Error, collectPageData } from '../utils';

/**
 * Retrieves the pages associated with a given package name.
 *
 * @param packageName - The name of the package for which to retrieve pages.
 * @returns A promise that resolves to an array of CombinedPageData objects.
 */
export const getPackagePages: STUDIOCMS_SDK_GET['packagePages'] = async (packageName) => {
	try {
		const pages: CombinedPageData[] = [];

		const pagesRaw = await db.select().from(tsPageData).where(eq(tsPageData.package, packageName));

		for (const page of pagesRaw) {
			const PageData = await collectPageData(page);

			pages.push(PageData);
		}

		return pages;
	} catch (error) {
		if (error instanceof Error) {
			throw new StudioCMS_SDK_Error(`Error getting pages: ${error.message}`, error.stack);
		}
		throw new StudioCMS_SDK_Error('Error getting pages: An unknown error occurred.', `${error}`);
	}
};

export default getPackagePages;
