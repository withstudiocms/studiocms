import { CMSSiteConfigId } from '../../consts.js';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import { tsSiteConfig } from '../tables.js';
import type { tsSiteConfigSelect } from '../types/index.js';
import { SDKCore_AUTH } from './auth.js';

/**
 * Effectful service for initializing core StudioCMS modules.
 *
 * @remarks
 * This service provides initialization routines for the StudioCMS system,
 * including setting up the site configuration and ensuring the existence of the ghost user.
 *
 * @example
 * ```typescript
 * const init = yield* SDKCore_INIT;
 * yield* init.siteConfig({ ... });
 * yield* init.ghostUser();
 * ```
 *
 * @service
 * - Depends on AstroDB and SDKCore_AUTH services.
 *
 * @throws {StudioCMS_SDK_Error}
 * Throws if database errors occur during initialization.
 */
export class SDKCore_INIT extends Effect.Service<SDKCore_INIT>()(
	'studiocms/sdk/SDKCore/modules/init',
	{
		dependencies: [AstroDB.Default, SDKCore_AUTH.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/init/effect')(function* () {
			const [dbService, AUTH] = yield* Effect.all([AstroDB, SDKCore_AUTH]);

			const INIT = {
				/**
				 * Initializes the StudioCMS SiteConfig table with the provided configuration.
				 *
				 * @param config - The configuration to insert into the SiteConfig table.
				 * @returns A promise that resolves to the inserted site configuration.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the site configuration.
				 */
				siteConfig: (config: Omit<tsSiteConfigSelect, 'id'>) =>
					dbService
						.execute((db) =>
							db
								.insert(tsSiteConfig)
								// @ts-expect-error Drizzle... removed this from the type?
								.values({ ...config, id: CMSSiteConfigId })
								.returning()
								.get()
						)
						.pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`INIT.siteConfig Error: ${cause}`),
										})
									),
							})
						),
				/**
				 * Initializes the StudioCMS Ghost User.
				 *
				 * The ghost user is a default user that is used to perform actions on behalf of the system as well as to replace deleted users.
				 *
				 * @returns A promise that resolves to the ghost user record.
				 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the ghost user.
				 */
				ghostUser: () =>
					Effect.gen(function* () {
						const ghostUserRecord = yield* AUTH.user.ghost.get();
						if (!ghostUserRecord) {
							return yield* AUTH.user.ghost.create();
						}
						return ghostUserRecord;
					}),
			};

			return INIT;
		}),
	}
) {}
