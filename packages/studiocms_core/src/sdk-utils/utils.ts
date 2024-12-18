/// <reference types="@astrojs/db" />
import { db, eq } from 'astro:db';
import { AstroError } from 'astro/errors';
import {
	tsOAuthAccounts,
	tsPageContent,
	tsPageDataCategories,
	tsPageDataTags,
	tsPermissions,
} from './tables';
import type {
	BaseCacheObject,
	CacheConfig,
	CombinedPageData,
	CombinedRank,
	CombinedUserData,
	PageDataCacheObject,
	SingleRank,
	SiteConfig,
	SiteConfigCacheObject,
	StudioCMSCacheObject,
	tsPageDataSelect,
	tsPermissionsSelect,
	tsUsersSelect,
} from './types';

/**
 * Represents an error specific to the StudioCMS SDK.
 * This class extends the `AstroError` class to provide additional context
 * and functionality for errors occurring within the StudioCMS SDK.
 *
 * @extends {AstroError}
 */
export class StudioCMS_SDK_Error extends AstroError {
	override name = 'StudioCMS SDK Error';
}

/**
 * Handles an error by throwing a `StudioCMS_SDK_Error`.
 *
 * @param error - The error to handle. If the error is an instance of `StudioCMS_SDK_Error`,
 *                it rethrows the error. Otherwise, it wraps the error in a new `StudioCMS_SDK_Error`
 *                with the provided message and optional hint.
 * @param message - The message to use if the error is not an instance of `StudioCMS_SDK_Error`.
 * @param hint - Optional. A hint to help the user fix the error.
 *
 * @throws {StudioCMS_SDK_Error} - Throws an error with the appropriate message and hint.
 */
export function handleSDKError(error: unknown, message: string): never {
	// Check if the error is already a StudioCMS_SDK_Error
	if (error instanceof StudioCMS_SDK_Error) {
		// If it's already a StudioCMS_SDK_Error, rethrow it
		throw error;
	}

	// Check if the error is an instance of Error
	if (error instanceof Error) {
		// Extract original error details if available
		const originalMessage = error.message;
		const originalStack = error.stack;

		// Create and throw a new StudioCMS_SDK_Error
		throw new StudioCMS_SDK_Error(
			`${message}${originalMessage ? `: ${originalMessage}` : ''}`,
			originalStack
		);
	}

	// Extract original error details if available
	const originalMessage = error instanceof Error ? error.message : String(error);

	// Create and throw a new StudioCMS_SDK_Error
	throw new StudioCMS_SDK_Error(`${message}${originalMessage ? `: ${originalMessage}` : ''}`);
}

/**
 * Collects user data by fetching OAuth data and permission data for the given user.
 *
 * @param user - The user object containing user information.
 * @returns A promise that resolves to an object containing combined user data, including OAuth data and permission data.
 */
export async function collectUserData(user: tsUsersSelect): Promise<CombinedUserData> {
	try {
		const [oAuthData, permissionData] = await db.batch([
			db.select().from(tsOAuthAccounts).where(eq(tsOAuthAccounts.userId, user.id)),
			db.select().from(tsPermissions).where(eq(tsPermissions.user, user.id)),
		]);

		return {
			...user,
			oAuthData: oAuthData,
			permissionsData: permissionData[0],
		};
	} catch (error) {
		handleSDKError(error, 'Error collecting user data: An unknown error occurred.');
	}
}

export function parseIdNumberArray(ids: unknown): number[] {
	return ids as number[];
}

export function parseIdStringArray(ids: unknown): string[] {
	return ids as string[];
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
	try {
		const categoryIds = parseIdNumberArray(page.categories || []);
		const categories: CombinedPageData['categories'] = [];

		const [head, ...tail] = categoryIds.map((id) =>
			db.select().from(tsPageDataCategories).where(eq(tsPageDataCategories.id, id))
		);

		if (head) {
			const categoryResults = await db.batch([head, ...tail]);
			categories.push(...categoryResults.flat().filter((result) => result !== undefined));
		}

		const tagIds = parseIdNumberArray(page.tags || []);
		const tags: CombinedPageData['tags'] = [];

		const [headTag, ...tailTag] = tagIds.map((id) =>
			db.select().from(tsPageDataTags).where(eq(tsPageDataTags.id, id))
		);

		if (headTag) {
			const tagResults = await db.batch([headTag, ...tailTag]);
			tags.push(...tagResults.flat().filter((result) => result !== undefined));
		}

		const contributorIds = parseIdStringArray(page.contributorIds || []);

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
			contributorIds: contributorIds,
			multiLangContent: multiLangContentData,
			defaultContent: defaultContentData,
		};
	} catch (error) {
		handleSDKError(error, 'Error collecting page data: An unknown error occurred.');
	}
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
	try {
		const filteredUsers = permissions.filter((user) => user.rank === rank);
		const permitted: { id: string; name: string }[] = [];

		for (const user of filteredUsers) {
			const foundUser = users.find((u) => u.id === user.user);

			if (foundUser) {
				permitted.push({ id: foundUser.id, name: foundUser.name });
			}
		}

		return permitted;
	} catch (error) {
		handleSDKError(error, 'Error verifying rank: An unknown error occurred.');
	}
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

/**
 * Creates a function to check if a cache entry has expired based on the current time and the cache lifetime.
 *
 * @param cacheConfig - The configuration object for the cache, which includes the lifetime of the cache.
 * @returns A function that checks if a given cache entry has expired.
 */
export function Expire(cacheConfig: CacheConfig) {
	return function isEntryExpired(entry: BaseCacheObject): boolean {
		return new Date().getTime() - entry.lastCacheUpdate.getTime() > cacheConfig.lifetime;
	};
}

/**
 * Checks if the cache has expired based on the last cache update time and the specified lifetime.
 *
 * @param lastCacheUpdate - The date and time when the cache was last updated.
 * @param lifetime - The lifetime of the cache in milliseconds.
 * @returns `true` if the cache has expired, otherwise `false`.
 */
export function isCacheExpired(lastCacheUpdate: Date, lifetime: number): boolean {
	return new Date().getTime() - lastCacheUpdate.getTime() > lifetime;
}

/**
 * Transforms the provided CombinedPageData into a PageDataCacheObject.
 *
 * @param data - The combined page data to be transformed.
 * @returns An object containing the last cache update timestamp and the provided data.
 */
export function transformNewDataReturn(data: CombinedPageData): PageDataCacheObject {
	return { lastCacheUpdate: new Date(), data };
}

/**
 * Sets a new entry in the cache map with the provided key and transformed data.
 *
 * @param cache - The cache Map object where the data will be stored.
 * @param key - The key under which the data will be stored in the cache.
 * @param data - The data to be transformed and stored in the cache.
 */
export function cacheMapSet(
	cache: StudioCMSCacheObject['pages'],
	key: string,
	data: CombinedPageData
): void {
	cache.set(key, transformNewDataReturn(data));
}

/**
 * Transforms the given site configuration data into a cache object.
 *
 * @param data - The site configuration data to be transformed.
 * @returns An object containing the last cache update timestamp and the transformed site configuration data.
 */
export function transformSiteConfigReturn(data: SiteConfig): SiteConfigCacheObject {
	return { lastCacheUpdate: new Date(), data };
}

/**
 * Fetches the latest version of the 'studiocms' package from the npm registry.
 *
 * @returns {Promise<string>} A promise that resolves to the latest version string of the 'studiocms' package.
 * @throws Will throw an error if the fetch operation fails.
 */
export async function getLatestVersion(): Promise<string> {
	try {
		const npmResponse = await fetch('https://registry.npmjs.org/studiocms/latest');
		const npmData = await npmResponse.json();
		return npmData.version as string;
	} catch (error) {
		handleSDKError(error, 'Error fetching latest version: An unknown error occurred.');
	}
}
