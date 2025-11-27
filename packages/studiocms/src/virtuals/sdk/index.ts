import config from 'studiocms:config';
import {
	type SDKCoreLive as _SDKLive,
	makeStudioCMSSDKCoreLive,
	type SDKContext,
} from '@withstudiocms/sdk';
import { Data, Effect } from 'effect';
import { GhostUserDefaults, NotificationSettingsDefaults } from '../../consts.js';
import { getDbClient } from '../../db/index.js';
import { runEffect } from '../../effect.js';

/**
 * Error thrown when the database client fails to initialize
 */
export class DBClientInitializationError extends Data.TaggedError('DBClientInitializationError')<{
	cause: unknown;
}> {}

/**
 * Error thrown when the SDK fails to initialize
 */
export class SDKInitializationError extends Data.TaggedError('SDKInitializationError')<{
	cause: unknown;
}> {}

/**
 * Type representing the live StudioCMS SDK Core Effect without requirements,
 * with specific error types for database client and SDK initialization failures.
 */
export type SDKCoreLive = _SDKLive extends Effect.Effect<infer A, infer _E, infer R>
	? Effect.Effect<A, DBClientInitializationError | SDKInitializationError, R>
	: never;

/**
 * Utility type to extract the resolved value type from an Effect.
 *
 * @typeParam T - The Effect type from which to extract the resolved value.
 * @returns The resolved value type of the Effect.
 */
export type GetJs<T> = T extends Effect.Effect<infer A, infer _E, infer _R> ? A : never;

/**
 * Builds the SDK context using the provided database client.
 *
 * @param db - The database client to be used in the SDK context.
 * @returns An Effect that produces the SDK context with the database client and default settings.
 */
export const buildSDKContext = Effect.fn((db: SDKContext['db']) =>
	Effect.sync(() => ({
		db,
		defaults: {
			GhostUserDefaults,
			NotificationSettingsDefaults,
		},
	}))
);

/**
 * The main StudioCMS SDK Core Effect.
 *
 * @remarks
 * This Effect initializes the database client based on the configured dialect,
 * and then creates the StudioCMS SDK Core using the database client and default settings.
 */
export const SDKCore: SDKCoreLive = getDbClient(config.db.dialect).pipe(
	Effect.catchAll((cause) => new DBClientInitializationError({ cause })),
	Effect.flatMap(buildSDKContext),
	Effect.flatMap(makeStudioCMSSDKCoreLive),
	Effect.catchAll((cause) => new SDKInitializationError({ cause }))
);

/**
 * Converts the `SDKCore` effect to a vanilla JavaScript object by removing the `_tag` property.
 *
 * @remarks
 * This function uses `Effect.gen` to yield the `SDKCore` effect, destructures the result to exclude the `_tag` property,
 * and then passes the remaining core properties to `runEffect`.
 *
 * @returns A promise that resolves to the core properties of `SDKCore` as a plain JavaScript object.
 */
export const SDKCoreJs: GetJs<SDKCoreLive> = await runEffect(SDKCore);

/**
 * Alias for `runEffect`, used to run SDK effects and convert them to plain JavaScript objects.
 *
 * @param effect - The Effect to be converted.
 * @returns A promise that resolves to the plain JavaScript object representation of the effect's result.
 */
export const runSDK = runEffect;
