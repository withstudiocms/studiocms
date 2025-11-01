import { Effect, Schema } from '@withstudiocms/effect';
import { StudioCMSAPIKeys, StudioCMSPermissions } from '@withstudiocms/kysely';
import { DBClientLive } from '../../context.js';
import { SDKGenerators } from '../util/generators.js';

/**
 * SDKRestAPIModule
 *
 * Effect-based module that provides REST API operations for managing StudioCMS API keys and verifying tokens.
 *
 * @remarks
 * - Composed with DBClientLive and SDKGenerators (exposes withCodec, withEncoder and generateToken).
 * - Persists and queries data against the 'StudioCMSAPIKeys' and 'StudioCMSPermissions' tables.
 * - All public operations are provided as Effects and use runtime codecs/encoders for input/output validation.
 * - New keys are generated via the provided generator and persisted with a UUID created by crypto.randomUUID().
 *
 * Exposed surface (tokens):
 * - tokens.get(userId: string): Effect<StudioCMSAPIKeys.Select[]>
 *   Retrieves all API tokens for the specified user.
 *
 * - tokens.new(userId: string, description: string): Effect<StudioCMSAPIKeys.Select>
 *   Generates a new API key for the given user, persists it, and returns the created record.
 *
 * - tokens.delete({ userId: string; tokenId: string }): Effect<void>
 *   Deletes the specified API token for the user.
 *
 * - tokens.verify(key: string): Effect<{ userId: string; key: string; rank: number } | false>
 *   Validates the provided API key. If valid, returns the associated userId, key and permission rank; otherwise returns false.
 *
 * @returns An Effect that resolves to an object containing the `tokens` API.
 *
 * @example
 * // Usage (conceptual)
 * const { tokens } = yield* SDKRestAPIModule;
 * const created = yield* tokens.new('user-123', 'automation key');
 * const all = yield* tokens.get('user-123');
 * const infoOrFalse = yield* tokens.verify(created.key);
 */
export const SDKRestAPIModule = Effect.gen(function* () {
	const [{ withCodec, withEncoder }, { generateToken }] = yield* Effect.all([
		DBClientLive,
		SDKGenerators,
	]);

	// ===========================================================
	// DB Operations
	// ===========================================================

	/**
	 * Retrieves all API tokens for a specific user.
	 *
	 * @param userId - The ID of the user whose tokens are to be retrieved.
	 */
	const _getTokensForUser = withCodec({
		encoder: Schema.String,
		decoder: Schema.Array(StudioCMSAPIKeys.Select),
		callbackFn: (db, userId) =>
			db((client) =>
				client.selectFrom('StudioCMSAPIKeys').selectAll().where('userId', '=', userId).execute()
			),
	});

	/**
	 * Creates a new API token for a specific user.
	 *
	 * @param tokenData - The data for the new token to be created.
	 */
	const _newToken = withCodec({
		encoder: StudioCMSAPIKeys.Insert,
		decoder: StudioCMSAPIKeys.Select,
		callbackFn: (db, tokenData) =>
			db((client) =>
				client
					.insertInto('StudioCMSAPIKeys')
					.values(tokenData)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes an API token for a specific user.
	 *
	 * @param userId - The ID of the user whose token is to be deleted.
	 * @param tokenId - The ID of the token to be deleted.
	 */
	const _deleteToken = withEncoder({
		encoder: Schema.Struct({
			userId: Schema.String,
			tokenId: Schema.String,
		}),
		callbackFn: (db, { userId, tokenId }) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSAPIKeys')
					.where('userId', '=', userId)
					.where('id', '=', tokenId)
					.execute()
			),
	});

	/**
	 * Retrieves an API key by its unique identifier.
	 *
	 * @param key - The unique identifier of the API key to retrieve.
	 */
	const _getByKey = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSAPIKeys.Select),
		callbackFn: (db, key) =>
			db((client) =>
				client.selectFrom('StudioCMSAPIKeys').selectAll().where('key', '=', key).executeTakeFirst()
			),
	});

	/**
	 * Retrieves the permissions associated with a specific user ID.
	 *
	 * @param userId - The ID of the user whose permissions are to be retrieved.
	 */
	const _getKeyPermissions = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSPermissions.Select),
		callbackFn: (db, userId) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPermissions')
					.selectAll()
					.where('user', '=', userId)
					.executeTakeFirst()
			),
	});

	// ===========================================================
	// Helpers
	// ===========================================================

	/**
	 * Creates a new API token for a user with the specified description.
	 *
	 * @param userId - The ID of the user for whom to create the token.
	 * @param description - A description for the API key.
	 * @returns An Effect that resolves to the created API key record.
	 */
	const _createNewTokenForUser = Effect.fn((userId: string, description: string) =>
		generateToken(userId, true).pipe(
			Effect.flatMap((key) =>
				_newToken({
					id: crypto.randomUUID(),
					key,
					userId,
					description,
				})
			)
		)
	);

	/**
	 * Verifies an API token and retrieves associated user information.
	 *
	 * @param key - The API token to verify.
	 * @returns An Effect that resolves to user information if the token is valid, or false if invalid.
	 */
	const _verifyToken = Effect.fn((key: string) =>
		Effect.gen(function* () {
			const apiKeyRecord = yield* _getByKey(key);
			if (!apiKeyRecord) return false;
			const permissionsRecord = yield* _getKeyPermissions(apiKeyRecord.userId);
			if (!permissionsRecord) return false;
			return {
				userId: apiKeyRecord.userId,
				key: apiKeyRecord.key,
				rank: permissionsRecord.rank,
			};
		})
	);

	// ===========================================================
	// Final Module
	// ===========================================================

	/**
	 * REST API related operations.
	 */
	const tokens = {
		/**
		 * Retrieves all API tokens for a specific user.
		 *
		 * @param userId - The ID of the user whose tokens are to be retrieved.
		 * @returns An Effect that resolves to an array of API keys for the user.
		 * @throws {LibSQLDatabaseError} If a database error occurs during the operation.
		 */
		get: _getTokensForUser,

		/**
		 * Creates a new API token for a user with the specified description.
		 *
		 * @param userId - The ID of the user for whom to create the token.
		 * @param description - A description for the API key.
		 * @returns An Effect that resolves to the created API key record.
		 * @throws {LibSQLDatabaseError} If a database error occurs during the operation.
		 */
		new: _createNewTokenForUser,

		/**
		 * Deletes an API token for a user by its ID.
		 *
		 * @param userId - The ID of the user whose token is to be deleted.
		 * @param tokenId - The ID of the API token to delete.
		 * @returns An Effect that resolves when the token is successfully deleted.
		 * @throws {LibSQLDatabaseError} If a database error occurs during the operation.
		 */
		delete: _deleteToken,

		/**
		 * Verifies an API token and retrieves associated user information.
		 *
		 * @param key - The API token to verify.
		 * @returns An Effect that resolves to user information if the token is valid, or false if invalid.
		 */
		verify: _verifyToken,
	};

	return { tokens };
});
