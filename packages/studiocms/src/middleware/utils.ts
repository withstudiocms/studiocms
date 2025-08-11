import { User } from 'studiocms:auth/lib';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import type { SiteConfigCacheObject } from 'studiocms:sdk/types';
import type { APIContext } from 'astro';
import { deepmergeCustom } from 'deepmerge-ts';
import { genLogger } from '../lib/effects/index.js';
import type { DeepPartial } from '../types.js';

/**
 * Retrieves the user's permission levels based on their session data.
 *
 * @param userData - The session data of the user.
 * @returns An object containing boolean flags indicating the user's permission levels:
 * - `isVisitor`: True if the user has at least visitor-level permissions.
 * - `isEditor`: True if the user has at least editor-level permissions.
 * - `isAdmin`: True if the user has at least admin-level permissions.
 * - `isOwner`: True if the user has owner-level permissions.
 */
export const getUserPermissions = (userData: UserSessionData) =>
	genLogger('studiocms/middleware/utils/getUserPermissions')(function* () {
		const { getUserPermissionLevel } = yield* User;
		const userPermissionLevel = yield* getUserPermissionLevel(userData);

		return {
			isVisitor: userPermissionLevel >= User.UserPermissionLevel.visitor,
			isEditor: userPermissionLevel >= User.UserPermissionLevel.editor,
			isAdmin: userPermissionLevel >= User.UserPermissionLevel.admin,
			isOwner: userPermissionLevel >= User.UserPermissionLevel.owner,
		};
	});

export const makeFallbackSiteConfig = (): SiteConfigCacheObject => ({
	lastCacheUpdate: new Date(),
	data: {
		defaultOgImage: null,
		description: 'A StudioCMS Project',
		diffPerPage: 10,
		enableDiffs: false,
		enableMailer: false,
		gridItems: [],
		hideDefaultIndex: false,
		loginPageBackground: 'studiocms-curves',
		loginPageCustomImage: null,
		siteIcon: null,
		title: 'StudioCMS-Setup',
	},
});

const deepmerge = deepmergeCustom({ mergeArrays: false });

/**
 * Updates the `StudioCMS` property within the `locals` object of the provided API context.
 *
 * This function performs a deep merge of the existing `StudioCMS` values with the provided partial values,
 * ensuring that nested objects are merged correctly and existing data is preserved.
 *
 * @param context - The API context containing the `locals` object to be updated.
 * @param values - A partial object containing the properties to update within `StudioCMS`.
 */
export function updateLocals(
	context: APIContext,
	values: DeepPartial<APIContext['locals']['StudioCMS']>
): APIContext['locals']['StudioCMS'] {
	// Remove undefined recursively to avoid clobbering nested values
	const cleanValues = deepOmitUndefined(values) as Partial<APIContext['locals']['StudioCMS']>;

	// Clone the current values to avoid mutating the original object
	const currentValues = context.locals.StudioCMS || {};

	// Use deepmerge to combine the current values with the clean values
	// This allows for partial updates without losing existing data.
	const updatedValues = deepmerge(currentValues, cleanValues) as APIContext['locals']['StudioCMS'];

	// Update the context locals with the merged values
	// This allows for partial updates without losing existing data
	context.locals.StudioCMS = updatedValues;
	return updatedValues;
}

function deepOmitUndefined<T>(input: T): T {
	if (input && typeof input === 'object' && !Array.isArray(input)) {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
			if (v !== undefined) {
				// biome-ignore lint/suspicious/noExplicitAny: We need to handle any type here
				out[k] = deepOmitUndefined(v as any);
			}
		}
		return out as T;
	}
	return input;
}
