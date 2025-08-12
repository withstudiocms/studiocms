import { User } from 'studiocms:auth/lib';
import type { UserSessionData } from 'studiocms:auth/lib/types';
import type { SiteConfigCacheObject } from 'studiocms:sdk/types';
import type { APIContext } from 'astro';
import {
	type DeepMergeBuiltInMetaData,
	type DeepMergeFunctionsURIs,
	type DeepMergeHKT,
	type DeepMergeOptions,
	deepmergeCustom,
	type GetDeepMergeFunctionsURIs,
} from 'deepmerge-ts';
import { Effect, genLogger } from '../effect.js';

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

/**
 * Creates a fallback site configuration object with default values.
 *
 * This function is typically used when no site configuration is available,
 * providing sensible defaults for the StudioCMS project.
 *
 * @returns {SiteConfigCacheObject} The fallback site configuration object.
 */
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

/**
 * Creates an Effect-based deep merge utility function with customizable merge options.
 *
 * This function builds a deep merge operation using the provided options, allowing for
 * custom merging behavior such as handling arrays or specific object types differently.
 * It leverages the Effect system for error handling and composability, ensuring that
 * any errors during the merge process are captured and returned as Effect failures.
 *
 * @template BaseTs - The base type of objects to be merged.
 * @template PMF - Partial mapping of custom deep merge function URIs.
 * @param opts - Options to customize the deep merge behavior, such as metadata or merge strategies.
 * @returns An Effect function that merges the provided objects or arrays according to the custom strategy,
 *          returning the merged result or an error if the merge fails.
 *
 * @example
 * ```typescript
 * const mergeEffect = effectMerge({ someOption: true });
 * const result = yield* mergeEffect(obj1, obj2, obj3);
 * ```
 */
// biome-ignore lint/complexity/noBannedTypes: this is a dynamic utility function
const effectMerge = <BaseTs = unknown, PMF extends Partial<DeepMergeFunctionsURIs> = {}>(
	opts: DeepMergeOptions<DeepMergeBuiltInMetaData, DeepMergeBuiltInMetaData> = {}
) =>
	Effect.fn(function* <Ts extends ReadonlyArray<BaseTs>>(...objects: readonly [...Ts]) {
		// Build the custom deepmerge function with the provided options
		// This allows for custom merging behavior, such as handling arrays differently
		const customMerge = Effect.try({
			try: () =>
				deepmergeCustom(opts) as <Ts extends ReadonlyArray<BaseTs>>(
					...objects: Ts
				) => DeepMergeHKT<Ts, GetDeepMergeFunctionsURIs<PMF>, DeepMergeBuiltInMetaData>,
			catch: (cause) =>
				new Error(
					`Failed to run deepmerge: ${cause instanceof Error ? cause.message : String(cause)}`
				),
		});

		// Create a deepmerge function that uses the custom merge strategy
		// This function will merge the provided objects or arrays according to the custom strategy
		const deepmerge = Effect.fn(function* <Ts extends ReadonlyArray<BaseTs>>(
			...objs: readonly [...Ts]
		) {
			const _deepmerge = yield* customMerge;
			return _deepmerge(...objs) as DeepMergeHKT<
				Ts,
				GetDeepMergeFunctionsURIs<PMF>,
				DeepMergeBuiltInMetaData
			>;
		});

		// Finally, execute the deepmerge function with the provided objects
		// This will return the merged result or throw an error if the merge fails
		// The Effect will handle any errors that occur during the merge process
		// This allows for a clean and type-safe way to merge objects or arrays
		// while providing detailed error handling
		return yield* deepmerge(...objects).pipe(
			Effect.catchAll((error) => {
				return Effect.fail(new Error(`Deep merge failed: ${error.message}`));
			})
		);
	});

/**
 * Represents the structure for setting local values in the StudioCMS context.
 *
 * @property general - Contains general StudioCMS local values, excluding 'security' and 'plugins'.
 * @property security - Contains security-related StudioCMS local values.
 * @property plugins - Contains plugin-related StudioCMS local values.
 */
export type SetLocalValues = {
	general: Omit<APIContext['locals']['StudioCMS'], 'security' | 'plugins'>;
	security: APIContext['locals']['StudioCMS']['security'];
	plugins: APIContext['locals']['StudioCMS']['plugins'];
};

/**
 * Represents the keys of the {@link SetLocalValues} type.
 * Useful for extracting valid property names from the {@link SetLocalValues} object type.
 */
export type SetLocalValuesKeys = keyof SetLocalValues;

/**
 * Enum representing different local settings categories.
 *
 * @remarks
 * Used to specify the context for local configuration, such as general settings,
 * security-related settings, or plugin-specific settings.
 *
 * @enum {string}
 * @property {string} general - Represents general settings.
 * @property {string} security - Represents security-related settings.
 * @property {string} plugins - Represents plugin-specific settings.
 */
export enum SetLocal {
	GENERAL = 'general',
	SECURITY = 'security',
	PLUGINS = 'plugins',
}

function getGeneralLocals(StudioCMS: APIContext['locals']['StudioCMS']): SetLocalValues['general'] {
	const { security: _s, plugins: _p, ...general } = StudioCMS || {};
	return general;
}

/**
 * Updates the `locals.StudioCMS` property of the given API context with new values for a specified key.
 *
 * Depending on the provided `key`, merges the new `values` into the corresponding section of `locals.StudioCMS`:
 * - `'general'`: Merges into the root of `StudioCMS`.
 * - `'security'`: Merges into the `security` property of `StudioCMS`.
 * - `'plugins'`: Merges into the `plugins` property of `StudioCMS`.
 *
 * Uses a deep merge strategy to combine existing and new values.
 *
 * @template T - The key of the section to update (`'general'`, `'security'`, or `'plugins'`).
 * @template V - The type of values to merge, corresponding to the section specified by `T`.
 * @param context - The API context containing the `locals.StudioCMS` object to update.
 * @param key - The section of `StudioCMS` to update.
 * @param values - The new values to merge into the specified section.
 * @returns The updated section of `locals.StudioCMS` after merging.
 * @throws {Error} If an unknown key is provided.
 */
export const setLocals = Effect.fn(function* <
	T extends SetLocalValuesKeys,
	V extends SetLocalValues[T],
>(context: APIContext, key: T, values: V) {
	switch (key) {
		case SetLocal.GENERAL: {
			// Merge general values into the root of StudioCMS
			// Exclude 'security' and 'plugins' to avoid overwriting them
			const generalValues = getGeneralLocals(context.locals.StudioCMS);
			const updatedValues = (yield* effectMerge({ mergeArrays: false })(
				generalValues,
				values
			)) as SetLocalValues[SetLocal.GENERAL];

			// Update the locals with the merged values
			// This will not overwrite 'security' or 'plugins'
			const toUpdate = getGeneralLocals(updatedValues);
			context.locals.StudioCMS = { ...toUpdate };
			break;
		}
		case SetLocal.SECURITY: {
			// Merge security values into the 'security' property of StudioCMS
			// This will not overwrite 'general' or 'plugins'
			const currentValues = context.locals.StudioCMS.security || {};
			const updatedValues = (yield* effectMerge({ mergeArrays: false })(
				currentValues,
				values
			)) as SetLocalValues[SetLocal.SECURITY];

			// Update the locals with the merged security values
			context.locals.StudioCMS.security = updatedValues;
			break;
		}
		case SetLocal.PLUGINS: {
			// Merge plugin values into the 'plugins' property of StudioCMS
			// This will not overwrite 'general' or 'security'
			const currentValues = context.locals.StudioCMS.plugins || {};
			const updatedValues = (yield* effectMerge({ mergeArrays: false })(
				currentValues,
				values
			)) as SetLocalValues[SetLocal.PLUGINS];

			// Update the locals with the merged plugin values
			context.locals.StudioCMS.plugins = updatedValues;
			break;
		}
		default:
			return yield* Effect.fail(new Error(`Unknown key: ${key}`));
	}
});
