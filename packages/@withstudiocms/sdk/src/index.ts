import { Deepmerge, Effect, Layer, Logger } from '@withstudiocms/effect';
import CacheService from './cache.js';
import { DBClientLive, makeSDKContext, type SDKContext } from './context.js';
import { makeLogger, setLoggerLevel } from './lib/logger.js';
import SDKModules from './modules/index.js';

export * from './context.js';

const loggerLayer = Logger.replace(Logger.defaultLogger, makeLogger);

/**
 * SDK Dependencies Layer
 */
export const SDKBaseDependencies = Layer.mergeAll(
	CacheService.Default,
	Deepmerge.Default,
	setLoggerLevel,
	loggerLayer
);

/**
 * Extracts an Effect type without its requirements.
 *
 * @typeParam E - The Effect type to extract from.
 */
export type ExtractEffectWithoutRequirements<E> =
	E extends Effect.Effect<infer A, infer E2, infer _R> ? Effect.Effect<A, E2, never> : never;

/**
 * StudioCMS SDK Core Layer
 */
export const StudioCMSSDKCore = Effect.all({
	dbService: DBClientLive,
	cache: CacheService,
	...SDKModules,
}).pipe(Effect.provide(SDKBaseDependencies));

/**
 * Type representing the live StudioCMS SDK Core Effect without requirements.
 */
export type SDKCoreLive = ExtractEffectWithoutRequirements<typeof StudioCMSSDKCore>;

/**
 * Provides a live Effect for the StudioCMS SDK Core using the given SDK context.
 *
 * @param context - The SDK context containing the database client and default options.
 * @returns A Effect that provides the StudioCMS SDK Core.
 */
export const makeStudioCMSSDKCoreLive = (context: SDKContext): SDKCoreLive =>
	StudioCMSSDKCore.pipe(Effect.provide(makeSDKContext(context)));
