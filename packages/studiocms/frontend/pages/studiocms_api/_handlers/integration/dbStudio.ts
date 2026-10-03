import config from 'studiocms:config';
import { HttpApiBuilder } from '@effect/platform';
import { Unauthorized } from '@effect/platform/HttpApiError';
import { CurrentUser } from '@withstudiocms/api-spec/astro-context';
import {
	DbStudioQueryError,
	IntegrationsAPIError,
	StudioCMSIntegrationsApiSpec,
} from '@withstudiocms/api-spec/integrations';
import { CMSLogger } from '@withstudiocms/effect';
import { Effect, Layer } from 'effect';
import { AstroLocalsAuthLive } from '../../_middleware/astroLocals.js';
import { getDriverInstance } from '../_utils/db-studio-driver.js';
import { parseLogLevel } from '../_utils/parseLogLevel.js';

/**
 * Custom error class used for quick escaping from deep error handling in the Effect chain.
 */
export class QuickEscapeError {
	readonly _tag = 'QuickEscapeError';
	constructor(public data: typeof DbStudioQueryError.Type) {}
}

/**
 * DB Studio API Handler.
 *
 * This handler manages the API routes for the DB Studio, including database queries and storage management.
 */
export const DbStudioAPIHandler = HttpApiBuilder.group(
	StudioCMSIntegrationsApiSpec,
	'dbStudio',
	(handlers) =>
		handlers.handle(
			'dbStudioQuery',
			Effect.fn(function* ({ payload }) {
				const isDev = import.meta.env.DEV;

				const logLevel = parseLogLevel(config.logLevel);

				const log = new CMSLogger({ level: logLevel }, 'studiocms:database/studio');

				// Check if demo mode is enabled
				if (config.features.developerConfig.demoMode !== false) {
					return yield* new Unauthorized();
				}

				const currentUser = yield* CurrentUser;

				// Security check: only allow access in the following cases
				// 1. In development mode
				// 2. In production, only if the user is an owner
				if (!isDev && currentUser.permissionLevel !== 'owner') {
					return yield* new Unauthorized();
				}

				// Get the database driver instance
				const driver = yield* getDriverInstance().pipe(
					Effect.catchTag(
						'DriverError',
						(error) =>
							new IntegrationsAPIError({
								error: `Failed to get database driver: ${error.message}`,
							})
					)
				);

				log.debug(`Received ${payload.type} request`);

				return yield* Effect.tryPromise({
					try: async () => {
						if (payload.type === 'query') {
							const r = await driver.query(payload.statement);
							return {
								type: payload.type,
								id: payload.id,
								data: r,
							};
						}
						const r = await driver.batch(payload.statements as string[]);
						log.debug(`${payload.type} executed with ${r.length} results`);
						return {
							type: payload.type,
							id: payload.id,
							data: r,
						};
					},
					catch: (cause) =>
						new QuickEscapeError(
							DbStudioQueryError.make({
								id: payload.id,
								type: payload.type,
								error: cause instanceof Error ? cause.message : String(cause),
							})
						),
				}).pipe(Effect.catchTag('QuickEscapeError', ({ data }) => Effect.succeed(data)));
			})
		)
).pipe(Layer.provide(AstroLocalsAuthLive));
