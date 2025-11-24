import { Deepmerge, Effect, Layer } from '@withstudiocms/effect';
import CacheService from './cache.js';
import { DBClientLive, makeSDKContext, type SDKContext } from './context.js';
import SDKModules from './modules/index.js';

export * from './context.js';

/**
 * SDK Dependencies Layer
 */
const SDKBaseDependencies = Layer.mergeAll(CacheService.Default, Deepmerge.Default);

/**
 * StudioCMS SDK Core Layer
 */
export const StudioCMSSDKCore = Effect.all({
	dbService: DBClientLive,
	cache: CacheService,
	...SDKModules,
}).pipe(Effect.provide(SDKBaseDependencies));

/**
 * Provides a live Effect for the StudioCMS SDK Core using the given SDK context.
 *
 * @param context - The SDK context containing the database client and default options.
 * @returns A Effect that provides the StudioCMS SDK Core.
 */
export const makeStudioCMSSDKCoreLive = (context: SDKContext) =>
	StudioCMSSDKCore.pipe(Effect.provide(makeSDKContext(context)));
