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
	CombinedRank,
	CombinedUserData,
	SingleRank,
	tsPageDataCategoriesSelect,
	tsPageDataSelect,
	tsPageDataTagsSelect,
	tsPermissionsSelect,
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

/**
 * Verifies and filters users based on their rank and permissions.
 *
 * @param users - An array of user objects to be verified.
 * @param permissions - An array of permission objects to check against.
 * @param rank - The rank to filter users by.
 * @returns An array of objects containing the id and name of users with the specified rank.
 */
export function verifyRank(
	users: tsUsersSelect[],
	permissions: tsPermissionsSelect[],
	rank: string
): SingleRank[] {
	const filteredUsers = permissions.filter((user) => user.rank === rank);
	const permitted: { id: string; name: string }[] = [];

	for (const user of filteredUsers) {
		const foundUser = users.find((u) => u.id === user.user);

		if (foundUser) {
			permitted.push({ id: foundUser.id, name: foundUser.name });
		}
	}

	return permitted;
}

/**
 * Combines a given rank with an array of users, returning a new array where each user is combined with the rank.
 *
 * @param rank - The rank to be combined with each user.
 * @param users - An array of users, each represented by a SingleRank object.
 * @returns An array of CombinedRank objects, where each object contains the given rank and the properties of a user.
 */
export function combineRanks(rank: string, users: SingleRank[]): CombinedRank[] {
	return users.map((user) => ({ rank, ...user }));
}
