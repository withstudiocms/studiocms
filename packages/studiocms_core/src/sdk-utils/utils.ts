/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import {
	tsOAuthAccounts,
	tsPageContent,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
	tsUsers,
} from './tables';
import type {
	CombinedPageData,
	CombinedRank,
	CombinedUserData,
	GenericTable,
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
 * Executes a batch query on the database for the given IDs and table.
 *
 * @template returnType - The type of the return value.
 * @param {Array<number | string>} ids - An array of IDs to query.
 * @param {GenericTable} table - The table to query against.
 * @returns {Promise<returnType[]>} A promise that resolves to an array of results of type `returnType`.
 */
export async function runDbBatchQuery<returnType>(
	ids: Array<number | string>,
	table: GenericTable
): Promise<returnType[]> {
	const batchQueries = [];

	for (const id of ids) {
		batchQueries.push(db.select().from(table).where(eq(table.id, id)));
	}

	const [head, ...tail] = batchQueries;

	if (head) {
		const queryResults = await db.batch([head, ...tail]);
		// Flatten and filter the results
		return queryResults.flat().filter(Boolean) as returnType[];
	}

	return [] as returnType[];
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
	const categories = await runDbBatchQuery<tsPageDataCategoriesSelect>(
		page.categories as number[],
		tsPageDataCategories
	);

	const tags = await runDbBatchQuery<tsPageDataTagsSelect>(page.tags as number[], tsPageDataTags);

	const contributors = await runDbBatchQuery<string>(page.contributorIds as string[], tsUsers);

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

/**
 * Generates a random ID number with the specified length for Tags and Categories.
 *
 * @param length - The length of the random ID number to generate.
 *
 * @returns A random ID number with the specified length.
 */
export function generateRandomIDNumber(length: number): number {
	return Math.floor(Math.random() * 10 ** length);
}
