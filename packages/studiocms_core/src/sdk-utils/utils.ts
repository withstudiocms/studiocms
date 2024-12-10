import { db, eq } from 'astro:db';
import {
	tsOAuthAccounts,
	tsPageContent,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
	tsUsers,
} from '../db/tsTables';
import type {
	CombinedPageData,
	CombinedUserData,
	tsPageDataCategoriesSelect,
	tsPageDataSelect,
	tsPageDataTagsSelect,
	tsUsersSelect,
} from './types';

/**
 * Collects user data by fetching OAuth data and permission data for the given user.
 *
 * @param user - The user object containing user information.
 * @returns A promise that resolves to an object containing combined user data, including OAuth data and permission data.
 */
export async function collectUserData(user: tsUsersSelect): Promise<CombinedUserData> {
	const [oAuthData, permissionData] = await db.batch([
		db.select().from(tsOAuthAccounts).where(eq(tsOAuthAccounts.userId, user.id)),
		db.select().from(tsPermissions).where(eq(tsPermissions.user, user.id)),
	]);

	return {
		...user,
		oAuthData: oAuthData,
		permissionsData: permissionData.pop(),
	};
}

/**
 * Collects and combines page data including categories, tags, contributors, and multilingual content.
 *
 * @param {tsPageDataSelect} page - The page data to collect information for.
 * @returns {Promise<CombinedPageData>} A promise that resolves to the combined page data.
 *
 * The function performs the following steps:
 * 1. Initializes empty arrays for categories, tags, and contributors.
 * 2. Fetches all categories, tags, and users from the database in a batch operation.
 * 3. Iterates over the page's categories, tags, and contributor IDs to find and collect the corresponding data.
 * 4. Fetches multilingual content data for the page from the database.
 * 5. Finds the default content data from the multilingual content data.
 * 6. Returns the combined page data including categories, tags, contributors, multilingual content, and default content.
 */
export async function collectPageData(page: tsPageDataSelect): Promise<CombinedPageData> {
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

	const multiLangContentData = await db
		.select()
		.from(tsPageContent)
		.where(eq(tsPageContent.contentId, page.id));

	const defaultContentData = multiLangContentData.find(
		(content) => content.contentLang === 'default'
	);

	return {
		...page,
		categories,
		tags,
		contributorIds: contributors,
		multiLangContent: multiLangContentData,
		defaultContent: defaultContentData,
	};
}
