import { Deepmerge, Effect, Layer } from '@withstudiocms/effect';
import { CacheService } from './cache.js';
import { DBClientLive } from './context.js';
import { SDKConfigModule } from './modules/config/index.js';

export * from './context.js';

/**
 * SDK Dependencies Layer
 */
const SDKDependencies = Layer.mergeAll(CacheService.Default, Deepmerge.Default);

/**
 * StudioCMS SDK Core Layer
 */
export const StudioCMSSDKCore = Effect.all({
	dbService: DBClientLive,
	CONFIG: SDKConfigModule,
}).pipe(Effect.provide(SDKDependencies));
