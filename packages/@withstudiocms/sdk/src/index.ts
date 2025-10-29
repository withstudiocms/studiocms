import { Deepmerge, Effect, Layer } from '@withstudiocms/effect';
import { CacheService } from './cache.js';
import { DBClientLive as dbService } from './context.js';
import { SDKConfigModule as CONFIG } from './modules/config/index.js';

export * from './context.js';

/**
 * SDK Dependencies Layer
 */
const SDKDependencies = Layer.mergeAll(CacheService.Default, Deepmerge.Default);

/**
 * StudioCMS SDK Core Layer
 */
export const StudioCMSSDKCore = Effect.all({
	dbService,
	CONFIG,
}).pipe(Effect.provide(SDKDependencies));
