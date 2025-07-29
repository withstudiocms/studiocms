import { and, eq } from 'astro:db';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB, SDKCore_Generators } from '../effect/index.js';
import { tsAPIKeys, tsPermissions } from '../tables.js';
import { _clearLibSQLError } from '../utils.js';

/**
 * Provides REST API token management functionality for the StudioCMS SDK.
 *
 * This service exposes methods for creating, retrieving, deleting, and verifying API tokens
 * associated with users. It integrates with the database and token generator services.
 *
 * @remarks
 * - Handles database errors gracefully using custom error handlers.
 * - Uses Drizzle ORM for database operations.
 * - Token verification also retrieves user rank from permissions table.
 *
 * @example
 * ```typescript
 * const api = yield* Effect.service(SDKCore_REST_API);
 * const tokens = yield* api.tokens.get(userId);
 * ```
 *
 * @dependencies
 * - AstroDB.Default: Database service for executing queries.
 * - SDKCore_Generators.Default: Token generation utilities.
 *
 * @effect
 * - All methods return Effect-wrapped results for composability and error handling.
 *
 * @module studiocms/sdk/SDKCore/modules/rest_api
 */
export class SDKCore_REST_API extends Effect.Service<SDKCore_REST_API>()(
	'studiocms/sdk/SDKCore/modules/rest_api',
	{
		dependencies: [AstroDB.Default, SDKCore_Generators.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/rest_api/effect')(function* () {
			const [dbService, { generateToken }] = yield* Effect.all([AstroDB, SDKCore_Generators]);

			const REST_API = {
				tokens: {
					/**
					 * Retrieves all API tokens for a specific user.
					 * @param userId - The ID of the user whose tokens are to be retrieved.
					 * @returns An Effect that resolves to an array of API keys for the user.
					 * @throws {LibSQLDatabaseError} If a database error occurs during the operation.
					 */
					get: dbService.makeQuery((ex, userId: string) =>
						ex((db) => db.select().from(tsAPIKeys).where(eq(tsAPIKeys.userId, userId))).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('REST_API.tokens.get', cause),
							})
						)
					),

					/**
					 * Creates a new API token for a user with the specified description.
					 * @param userId - The ID of the user for whom to create the token.
					 * @param description - A description for the API key.
					 * @returns An Effect that resolves to the created API key record.
					 * @throws {LibSQLDatabaseError} If a database error occurs during the operation.
					 */
					new: (userId: string, description: string) =>
						Effect.gen(function* () {
							const key = yield* generateToken(userId, true);

							return yield* dbService.execute((db) =>
								db
									.insert(tsAPIKeys)
									.values({
										// @ts-expect-error Drizzle... removed this from the type?
										id: crypto.randomUUID(),
										creationDate: new Date(),
										userId,
										key,
										description,
									})
									.returning()
									.get()
							);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('REST_API.tokens.new', cause),
							})
						),

					/**
					 * Deletes an API token for a user by its ID.
					 * @param userId - The ID of the user whose token is to be deleted.
					 * @param tokenId - The ID of the API token to delete.
					 * @returns An Effect that resolves when the token is successfully deleted.
					 * @throws {LibSQLDatabaseError} If a database error occurs during the operation.
					 */
					delete: (userId: string, tokenId: string) =>
						dbService
							.execute((db) =>
								db
									.delete(tsAPIKeys)
									.where(and(eq(tsAPIKeys.userId, userId), eq(tsAPIKeys.id, tokenId)))
							)
							.pipe(
								Effect.catchTags({
									'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
										_clearLibSQLError('REST_API.tokens.delete', cause),
								})
							),

					/**
					 * Verifies an API key and retrieves the associated user ID and rank.
					 * @param key - The API key to verify.
					 * @returns An Effect that resolves to an object containing userId, key, and rank if valid, or false if invalid.
					 * @throws {LibSQLDatabaseError} If a database error occurs during the verification.
					 */
					verify: (key: string) =>
						Effect.gen(function* () {
							const apiKey = yield* dbService.execute((db) =>
								db.select().from(tsAPIKeys).where(eq(tsAPIKeys.key, key)).get()
							);

							if (!apiKey) return false;

							const keyRank = yield* dbService.execute((db) =>
								db.select().from(tsPermissions).where(eq(tsPermissions.user, apiKey.userId)).get()
							);

							if (!keyRank) return false;

							return {
								userId: apiKey.userId,
								key: apiKey.key,
								rank: keyRank.rank,
							};
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('REST_API.tokens.verify', cause),
							})
						),
				},
			};

			return REST_API;
		}),
	}
) {}
