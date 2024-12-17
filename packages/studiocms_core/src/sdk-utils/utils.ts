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
	SingleRank,
	TimeString,
	TimeUnit,
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
		if (error instanceof Error) {
			throw new StudioCMS_SDK_Error(`Error collecting user data: ${error.message}`, error.stack);
		}
		throw new StudioCMS_SDK_Error(
			'Error collecting user data: An unknown error occurred.',
			`${error}`
		);
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
		if (error instanceof Error) {
			throw new StudioCMS_SDK_Error(`Error collecting page data: ${error.message}`, error.stack);
		}
		throw new StudioCMS_SDK_Error(
			'Error collecting page data: An unknown error occurred.',
			`${error}`
		);
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
		if (error instanceof Error) {
			throw new StudioCMS_SDK_Error(`Error verifying rank: ${error.message}`, error.stack);
		}
		throw new StudioCMS_SDK_Error('Error verifying rank: An unknown error occurred.', `${error}`);
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
 * Converts a time string to milliseconds.
 *
 * @param timeString - A string representing the time duration.
 *                     It should be in the format of a number followed by a unit,
 *                     such as '5m' for 5 minutes or '1h' for 1 hour.
 *
 * @returns The time duration in milliseconds.
 *
 * @throws Will throw an error if the input string is not in the correct format.
 *
 * @example
 * ```typescript
 * timeToMilliseconds('5m'); // Returns 300000
 * timeToMilliseconds('1h'); // Returns 3600000
 * ```
 */
export function timeToMilliseconds(timeString: TimeString): number {
	if (typeof timeString !== 'string') {
		throw new Error("Invalid time format. Use values like '5m', '1h', etc.");
	}

	// Define time multipliers
	const timeUnits: Record<TimeUnit, number> = {
		m: 60 * 1000, // Minutes to milliseconds
		h: 60 * 60 * 1000, // Hours to milliseconds
	};

	// Extract the numeric value and unit from the input string
	const match = timeString.match(/^(\d+)([mh])$/);
	if (!match) {
		throw new Error("Invalid time format. Use values like '5m', '1h', etc.");
	}

	const valMatch = match[1];

	if (!valMatch) {
		throw new Error("Invalid time format. Use values like '5m', '1h', etc.");
	}

	const value = Number.parseInt(valMatch, 10); // Numeric portion
	const unit = match[2] as TimeUnit; // Unit portion, safely cast to TimeUnit

	// Return the converted time in milliseconds
	return value * timeUnits[unit];
}

/**
 * Creates a function to check if a cache entry has expired based on the current time and the cache lifetime.
 *
 * @param cacheConfig - The configuration object for the cache, which includes the lifetime of the cache.
 * @returns A function that checks if a given cache entry has expired.
 */
export function Expire(cacheConfig: CacheConfig) {
	return function isEntryExpired(entry: BaseCacheObject): boolean {
		return (
			new Date().getTime() - entry.lastCacheUpdate.getTime() >
			timeToMilliseconds(cacheConfig.lifetime)
		);
	};
}
