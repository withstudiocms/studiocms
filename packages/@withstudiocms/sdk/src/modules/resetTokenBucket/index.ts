import { Effect, Schema } from '@withstudiocms/effect';
import { type DBCallbackFailure, StudioCMSUserResetTokens } from '@withstudiocms/kysely';
import type { DatabaseError } from '@withstudiocms/kysely/core/errors';
import { DBClientLive } from '../../context.js';
import type { JwtVerificationResult } from '../../types.js';
import { SDKGenerators } from '../util/generators.js';

/**
 * Error class representing a failure in the reset token bucket operations.
 */
export class resetTokenBucketFail {
	readonly _tag = 'resetTokenBucketFail';
}

/**
 * SDKResetTokenBucketModule
 *
 * Effectful module that provides reset-token management backed by the application database
 * and a JWT-based token generator/verifier. The module is constructed as an Effect generator
 * and depends on the DB client layer and token-generation/test utilities (resolved via
 * DBClientLive and SDKGenerators).
 *
 * The resolved value is an object exposing three primary operations:
 * - new(userId: string): Effect<E, Error, StudioCMSUserResetTokens.Select.Type>
 *     - Generates a cryptographically strong token for the supplied userId, persists a new
 *       reset-token record (with a generated UUID id and the token string) into the
 *       StudioCMSUserResetTokens table, and returns the inserted DB record.
 *     - Side effects: inserts into the DB, uses token-generation service.
 *     - Errors: database errors or generator errors may be raised by the returned effect.
 *
 * - delete(userId: string): Effect<E, Error, void>
 *     - Deletes any reset-token record(s) associated with the supplied userId.
 *     - Side effects: deletes from the DB.
 *     - Errors: database errors may be raised by the returned effect.
 *
 * - check(token: string): Effect<E, never, boolean>
 *     - Verifies whether the provided token is valid and matches the currently stored
 *       reset-token for the associated user:
 *       1. Validates and verifies the token using the token verifier.
 *       2. Retrieves the stored token record for the userId extracted from the token.
 *       3. Compares the stored token string to the provided token and returns true/false.
 *     - The method treats invalid token verification as a domain failure type
 *       (resetTokenBucketFail) internally; that failure is caught and normalized to `false`.
 *     - Side effects: reads from the DB, uses token verification service.
 *     - Errors: unexpected runtime/database errors may still surface from the returned effect.
 *
 * Remarks:
 * - The implementation uses codec- and encoder-wrappers for DB interactions (encoders/decoders
 *   for StudioCMSUserResetTokens) to ensure schema conformance on read/write.
 * - Token creation uses a generated UUID for the DB record id and a generator service for the
 *   token payload. Token verification relies on the provided testToken function (from SDKGenerators).
 * - The `check` operation intentionally swallows the domain-level `resetTokenBucketFail` and
 *   returns `false` to represent invalid/malformed tokens as a boolean outcome; other errors
 *   (e.g. DB connectivity) are not masked.
 *
 * Example:
 * const resetBucket = yield* Effect.runPromise(SDKResetTokenBucketModule);
 * await Effect.runPromise(resetBucket.new("user-id"));
 * const isValid = await Effect.runPromise(resetBucket.check("token-string"));
 *
 * Type parameters and environment:
 * - The module itself is returned as an Effect and therefore requires the Effect environment
 *   that provides the DB and token generator/test layers. Consumers should provide those
 *   dependencies when running the effect.
 *
 * @public
 */
export const SDKResetTokenBucketModule = Effect.gen(function* () {
	const [{ withCodec, withEncoder }, { generateToken, testToken }] = yield* Effect.all([
		DBClientLive,
		SDKGenerators,
	]);

	// =======================================================
	// DB Operations
	// =======================================================

	/**
	 * Creates a new reset token record in the database.
	 *
	 * @param data - The reset token data to insert.
	 * @returns An effect yielding the inserted reset token record.
	 */
	const _createNewToken = withCodec({
		encoder: StudioCMSUserResetTokens.Insert,
		decoder: StudioCMSUserResetTokens.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.insertInto('StudioCMSUserResetTokens')
					.values(data)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes the reset token record for the specified user ID.
	 *
	 * @param userId - The ID of the user whose reset token should be deleted.
	 * @returns An effect yielding the result of the delete operation.
	 */
	const _deleteTokenByUserId = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, userId) =>
			db((client) =>
				client.deleteFrom('StudioCMSUserResetTokens').where('userId', '=', userId).execute()
			),
	});

	/**
	 * Retrieves the reset token record for the specified user ID.
	 *
	 * @param userId - The ID of the user whose reset token should be retrieved.
	 * @returns An effect yielding the reset token record or undefined if not found.
	 */
	const _getTokenByUserId = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSUserResetTokens.Select),
		callbackFn: (db, userId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSUserResetTokens')
					.selectAll()
					.where('userId', '=', userId)
					.executeTakeFirst()
			),
	});

	// =======================================================
	// Helpers
	// =======================================================

	/**
	 * Creates a new reset token record for the specified user.
	 *
	 * @param userId - The ID of the user for whom to create the reset token.
	 * @returns An effect yielding the created reset token record.
	 */
	const _createUserResetToken = Effect.fn((userId: string) =>
		generateToken(userId).pipe(
			Effect.flatMap((token) =>
				_createNewToken({
					id: crypto.randomUUID(),
					userId,
					token,
				})
			)
		)
	);

	/**
	 * Checks if the specified reset token is valid.
	 *
	 * @param token - The reset token to check.
	 * @returns An effect yielding a boolean indicating whether the token is valid.
	 */
	const _checkIfValid = Effect.fn(
		(
			token: JwtVerificationResult
		): Effect.Effect<JwtVerificationResult, resetTokenBucketFail, never> =>
			!token.isValid || !token.userId
				? Effect.fail(new resetTokenBucketFail())
				: Effect.succeed(token)
	);

	/**
	 * Retrieves the reset token information for the specified user ID.
	 *
	 * @param userId - The ID of the user whose reset token information to retrieve.
	 * @returns An effect yielding the reset token record or undefined if not found.
	 */
	const _getTokenInfo = Effect.fn(
		({
			userId,
		}: JwtVerificationResult): Effect.Effect<
			typeof StudioCMSUserResetTokens.Select.Type | undefined,
			DBCallbackFailure | DatabaseError | resetTokenBucketFail,
			never
		> => (userId ? _getTokenByUserId(userId) : Effect.fail(new resetTokenBucketFail()))
	);

	/**
	 * Verifies if the retrieved reset token matches the provided token.
	 *
	 * @param token - The reset token to verify.
	 * @returns An effect yielding a boolean indicating whether the tokens match.
	 */
	const _verifyTokenMatch = (token: string) =>
		Effect.fn(
			(
				resetToken?: typeof StudioCMSUserResetTokens.Select.Type
			): Effect.Effect<boolean, resetTokenBucketFail, never> =>
				resetToken
					? Effect.succeed(resetToken.token === token)
					: Effect.fail(new resetTokenBucketFail())
		);

	/**
	 * Checks if the specified reset token is valid.
	 *
	 * @param token - The reset token to check.
	 * @returns An effect yielding a boolean indicating whether the token is valid.
	 */
	const _checkToken = Effect.fn((token: string) =>
		testToken(token).pipe(
			Effect.flatMap(_checkIfValid),
			Effect.flatMap(_getTokenInfo),
			Effect.flatMap(_verifyTokenMatch(token)),
			Effect.catchTag('resetTokenBucketFail', () => Effect.succeed(false))
		)
	);

	// =======================================================
	// Reset Token Bucket Operations
	// =======================================================

	/**
	 * Reset Token Bucket Module
	 */
	const resetTokenBucket = {
		/**
		 * Creates a new reset token for the specified user.
		 *
		 * @param userId - The ID of the user for whom to create the reset token.
		 * @returns An effect yielding the created reset token record.
		 */
		new: _createUserResetToken,

		/**
		 * Deletes the reset token for the specified user.
		 *
		 * @param userId - The ID of the user for whom to delete the reset token.
		 * @returns An effect yielding the result of the delete operation.
		 */
		delete: _deleteTokenByUserId,

		/**
		 * Checks if the specified reset token is valid.
		 *
		 * @param token - The reset token to check.
		 * @returns An effect yielding a boolean indicating whether the token is valid.
		 */
		check: _checkToken,
	};

	return resetTokenBucket;
});

export default SDKResetTokenBucketModule;
