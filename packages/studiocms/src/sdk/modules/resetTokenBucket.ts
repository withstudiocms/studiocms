import { eq } from 'astro:db';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB, SDKCore_Generators, SDKCore_Users } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import { tsUserResetTokens } from '../tables.js';
import type { tsUserResetTokensSelect } from '../types/index.js';
import { SDKCore_UPDATE } from './update.js';

/**
 * Provides an effectful service for managing user reset tokens in the StudioCMS SDK.
 *
 * This service includes methods to create, delete, and validate reset tokens for users.
 * It interacts with the database and token generator services, handling errors gracefully.
 *
 * @remarks
 * - Depends on AstroDB, SDKCore_Generators, SDKCore_Users, and SDKCore_UPDATE services.
 * - Handles database errors by wrapping them in `SDKCoreError`.
 *
 * @example
 * ```typescript
 * const resetTokenBucket = yield* SDKCore_ResetTokenBucket;
 * const token = yield* resetTokenBucket.new(userId);
 * const isValid = yield* resetTokenBucket.check(token);
 * yield* resetTokenBucket.delete(userId);
 * ```
 *
 * @method new
 * Creates a new reset token for the specified user and stores it in the database.
 * @param userId - The ID of the user for whom to create the reset token.
 * @returns An effect yielding the created reset token record.
 *
 * @method delete
 * Deletes all reset tokens associated with the specified user.
 * @param userId - The ID of the user whose reset tokens should be deleted.
 * @returns An effect yielding void.
 *
 * @method check
 * Validates whether a given token is valid and exists for a user.
 * @param token - The reset token to validate.
 * @returns An effect yielding a boolean indicating token validity.
 */
export class SDKCore_ResetTokenBucket extends Effect.Service<SDKCore_ResetTokenBucket>()(
	'studiocms/sdk/SDKCore/modules/resetTokenBucket',
	{
		dependencies: [
			AstroDB.Default,
			SDKCore_Generators.Default,
			SDKCore_Users.Default,
			SDKCore_UPDATE.Default,
		],
		effect: genLogger('studiocms/sdk/SDKCore/modules/resetTokenBucket/effect')(function* () {
			const [dbService, { generateToken, testToken }] = yield* Effect.all([
				AstroDB,
				SDKCore_Generators,
			]);

			const resetTokenBucket = {
				/**
				 * Creates a new reset token for the specified user and stores it in the database.
				 * @param userId - The ID of the user for whom to create the reset token.
				 * @returns An effect yielding the created reset token record.
				 */
				new: (userId: string): Effect.Effect<tsUserResetTokensSelect, SDKCoreError, never> =>
					Effect.gen(function* () {
						const token = yield* generateToken(userId);

						return yield* dbService.execute((db) =>
							db
								.insert(tsUserResetTokens)
								.values({ id: crypto.randomUUID(), userId, token })
								.returning()
								.get()
						);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`resetTokenBucket New Error: ${cause}`),
									})
								),
						})
					),

				/**
				 * Deletes all reset tokens associated with the specified user.
				 * @param userId - The ID of the user whose reset tokens should be deleted.
				 * @returns An effect yielding void.
				 */
				delete: (userId: string): Effect.Effect<void, SDKCoreError, never> =>
					dbService
						.execute((db) =>
							db.delete(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId))
						)
						.pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`resetTokenBucket Delete Error: ${cause}`),
										})
									),
							})
						),

				/**
				 * Validates whether a given token is valid and exists for a user.
				 * @param token - The reset token to validate.
				 * @returns An effect yielding a boolean indicating token validity.
				 */
				check: (token: string): Effect.Effect<boolean, SDKCoreError, never> =>
					Effect.gen(function* () {
						const { isValid, userId } = yield* testToken(token);

						if (!isValid) return false;
						if (!userId) return false;

						const resetToken = yield* dbService.execute((db) =>
							db.select().from(tsUserResetTokens).where(eq(tsUserResetTokens.userId, userId))
						);

						if (!resetToken || resetToken.length === 0) return false;

						return !!resetToken.find((t) => t.token === token);
					}).pipe(
						Effect.catchTags({
							'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
								Effect.fail(
									new SDKCoreError({
										type: 'LibSQLDatabaseError',
										cause: new StudioCMS_SDK_Error(`resetTokenBucket Check Error: ${cause}`),
									})
								),
						})
					),
			};

			return resetTokenBucket;
		}),
	}
) {}
