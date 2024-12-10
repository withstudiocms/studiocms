/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import { tsPageData } from '../../db/tsTables';
import type { CombinedPageData } from '../types';
import { collectPageData } from '../utils';

/**
 * Retrieves the pages associated with a given package name.
 *
 * @param packageName - The name of the package for which to retrieve pages.
 * @returns A promise that resolves to an array of CombinedPageData objects.
 */
export async function getPackagePages(packageName: string): Promise<CombinedPageData[]> {
	const pages: CombinedPageData[] = [];

	const pagesRaw = await db.select().from(tsPageData).where(eq(tsPageData.package, packageName));

	for (const page of pagesRaw) {
		const PageData = await collectPageData(page);

		pages.push(PageData);
	}

	return pages;
}

export default getPackagePages;
