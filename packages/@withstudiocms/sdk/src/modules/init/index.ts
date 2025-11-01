import { Effect } from '@withstudiocms/effect';
import SDKAuthModule from '../auth';
import SDKConfigModule from '../config';

/**
 * Initializes and exposes core StudioCMS SDK initialization utilities as an Effect.
 *
 * This module is an Effect.gen that awaits the SDK configuration and authentication modules
 * (SDKConfigModule and SDKAuthModule) and returns a small initialization surface for
 * higher-level SDK setup tasks.
 *
 * The returned object has two primary members:
 * - siteConfig: a function that initializes the StudioCMS SiteConfig table with the provided configuration.
 *   Use this to seed or update the persisted site configuration used by the SDK.
 * - ghostUser: a function that returns the system "ghost" user record. The ghost user is a default
 *   actor used for system-level actions and to replace deleted users when needed.
 *
 * Remarks:
 * - This Effect does not itself perform site or user initialization on import; it resolves to an object
 *   exposing operations that perform those tasks when invoked.
 * - If SDKConfigModule or SDKAuthModule fail to initialize, this Effect will fail accordingly.
 *
 *
 * Example:
 * ```ts
 * // inside an Effect.gen context
 * const init = yield* SDKInitModule;
 * // initialize site configuration
 * yield* init.siteConfig(mySiteConfig);
 * // fetch the ghost user
 * const ghost = yield* init.ghostUser();
 * ```
 */
export const SDKInitModule = Effect.gen(function* () {
	const [
		{ siteConfig: sdkSiteConfig },
		{
			user: { ghost },
		},
	] = yield* Effect.all([SDKConfigModule, SDKAuthModule]);

	/**
	 * Initializes the StudioCMS SDK modules.
	 */
	const INIT = {
		/**
		 * Initializes the StudioCMS SiteConfig table with the provided configuration.
		 *
		 * @param config - The configuration to insert into the SiteConfig table.
		 * @returns A promise that resolves to the inserted site configuration.
		 */
		siteConfig: sdkSiteConfig.init,

		/**
		 * Initializes the StudioCMS Ghost User.
		 *
		 * The ghost user is a default user that is used to perform actions on behalf of the system as well as to replace deleted users.
		 *
		 * @returns A promise that resolves to the ghost user record.
		 */
		ghostUser: ghost.get,
	};

	return INIT;
});

export default SDKInitModule;
