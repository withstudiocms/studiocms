import { Deepmerge, Effect, Layer } from '@withstudiocms/effect';
import { CacheService } from './cache.js';
import { DBClientLive as dbService, makeSDKContext, type SDKContext } from './context.js';
import { SDKAuthModule as AUTH } from './modules/auth/index.js';
import { SDKConfigModule as CONFIG } from './modules/config/index.js';
import { SDKDiffTrackingModule as diffTracking } from './modules/diffTracking/index.js';
import { SDKResetTokenBucketModule as resetTokenBucket } from './modules/resetTokenBucket/index.js';
import { SDKRestAPIModule as REST_API } from './modules/rest_api/index.js';
import { SDKUtilModule as UTIL } from './modules/util/index.js';

export * from './context.js';

/**
 * SDK Dependencies Layer
 */
const SDKDependencies = Layer.mergeAll(CacheService.Default, Deepmerge.Default);

// TODO: Placeholder Effects for unimplemented modules
const placeholder = Effect.succeed('todo' as const);

/**
 * StudioCMS SDK Core Layer
 */
export const StudioCMSSDKCore = Effect.all({
	dbService,
	AUTH,
	CLEAR: placeholder,
	CONFIG,
	DELETE: placeholder,
	diffTracking,
	GET: placeholder,
	INIT: placeholder,
	MIDDLEWARES: placeholder,
	notificationSettings: placeholder,
	PLUGINS: placeholder,
	POST: placeholder,
	UPDATE: placeholder,
	REST_API,
	UTIL,
	resetTokenBucket,
}).pipe(Effect.provide(SDKDependencies));

/**
 * Provides a live Effect for the StudioCMS SDK Core using the given SDK context.
 *
 * @param context - The SDK context containing the database client and default options.
 * @returns A Effect that provides the StudioCMS SDK Core.
 */
export const makeStudioCMSSDKCoreLive = (context: SDKContext) =>
	StudioCMSSDKCore.pipe(Effect.provide(makeSDKContext(context)));
