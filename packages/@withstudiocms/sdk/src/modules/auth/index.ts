import { Effect, Schema } from '@withstudiocms/effect';
import type { DBCallbackFailure } from '@withstudiocms/kysely';
import type { DatabaseError } from '@withstudiocms/kysely/core/errors';
import { DBClientLive, SDKDefaults } from '../../context.js';
import {
	StudioCMSEmailVerificationTokens,
	StudioCMSOAuthAccounts,
	StudioCMSPermissions,
	StudioCMSSessionTable,
	StudioCMSUsersTable,
} from '../../tables.js';
import {
	type AuthDeletionResponse,
	type AuthErrorHandlers,
	type AuthErrorTags,
	AuthErrorTagsEntries,
	type tsPermissions,
	type tsUsers,
	type tsUsersSelect,
} from '../../types.js';
import { SDKGenerators } from '../util/generators.js';

/**
 * SDKAuthModule
 *
 * High-level authentication/data-access module implemented as an Effect generator.
 * Returns a collection of sub-modules for working with email verification tokens,
 * OAuth accounts, permissions, sessions and users. Each operation is implemented
 * as composable Effect-driven functions that perform database operations, validate
 * inputs/outputs with codecs/encoders and return typed database entities or
 * domain-level results.
 *
 * Key characteristics
 * - Built on top of an Effect system: most exported operations are Effects or
 *   Effect.fn wrappers and should be run within the surrounding Effect runtime.
 * - Uses runtime codecs/encoders to validate and parse inputs/outputs when
 *   interacting with the database; DB rows returned conform to the project's
 *   table schemas (e.g., StudioCMSUsersTable.Select, StudioCMSSessionTable.Select).
 * - Encapsulates direct Kysely-style DB queries behind safe, validated call-sites.
 * - Contains helper flows for common workflows (e.g., generate + insert verification
 *   token, create user + permission, ensure ghost user exists).
 *
 * Returned sub-modules and notable behaviors
 * - verifyEmail
 *   - get(id: string): Effect that returns a verification token record or undefined.
 *   - create(userId: string): Effect that generates a token, deletes any existing
 *     token for the user and inserts a new token with an expiry (default 24h).
 *   - delete(userId: string): Effect that deletes tokens for userId.
 *
 * - oAuth
 *   - create(input): Effect that inserts a new OAuth account record.
 *   - delete({ userId, provider }): Effect that attempts to delete an OAuth account
 *     and returns a simple result object: { status: 'success'|'error', message: string }.
 *     The delete flow maps common DB error tags (e.g., DBCallbackFailure, NotFoundError,
 *     QueryError, QueryParseError) to meaningful status/message responses.
 *   - searchByProviderId(input): Effect that finds an OAuth account by providerUserId + userId.
 *
 * - permission
 *   - currentStatus(userId: string): Effect that returns the current permission row for a user
 *     or undefined if none exists.
 *
 * - session
 *   - create(sessionData): Effect that inserts a new session row and returns the created record.
 *   - getById(id: string): Effect that returns a session row or undefined.
 *   - sessionWithUser(sessionId: string): Effect that returns { session, user } or undefined
 *     if either the session or user does not exist.
 *   - delete(sessionId: string): Effect that deletes a session and returns a
 *     { status, message } result similar to oAuth.delete; common DB failures are mapped to
 *     friendly messages.
 *   - update({ id, newDate }): Effect that updates a session's expiresAt and returns the
 *     updated session record.
 *
 * - user
 *   - create(userData, rank): Composed Effect that creates a new user and then creates
 *     the corresponding permission record for the supplied rank.
 *   - update({ userId, userData }): Effect that updates user fields and returns the updated user.
 *   - searchUsersForUsernameOrEmail(username?, email?): Effect that searches by username and/or email
 *     and returns both result arrays ({ usernameSearch, emailSearch }).
 *   - ghost
 *     - verifyExists(): Effect<boolean> that returns true if the configured ghost user exists.
 *     - create(): Effect that creates the ghost user if missing and returns the ghost user row.
 *     - get(): Effect that returns the ghost user row, creating it if necessary.
 *
 * Errors and failure modes
 * - Most DB operations will propagate DB-level failures as Effect errors that the caller
 *   can handle or map. Certain "delete" operations intentionally catch DB error tags and
 *   convert them to structured success/error result objects for convenience.
 * - Insert/update operations use returningAll() and executeTakeFirstOrThrow(), so failed
 *   inserts/updates typically surface as runtime/DB errors within the Effect system.
 *
 * Usage notes
 * - All exported operations are intended to be composed and executed inside the project's
 *   Effect runtime. Consumers should use the project's Effect helpers to run or map results.
 * - The module relies on configured DB client, token generator and default values (e.g.,
 *   ghost user defaults). Ensure proper environment wiring before invoking these functions.
 *
 * Example (pseudocode)
 * const auth = yield* SDKAuthModule;
 * // create a user and permission
 * const newUser = yield* auth.user.create(userInsertPayload, 'admin');
 * // create and retrieve a session
 * const session = yield* auth.session.create(sessionPayload);
 * // create an email verification token
 * const token = yield* auth.verifyEmail.create(newUser.id);
 */
export const SDKAuthModule = Effect.gen(function* () {
	const [{ withCodec, withEncoder }, { generateToken }, { GhostUserDefaults }] = yield* Effect.all([
		DBClientLive,
		SDKGenerators,
		SDKDefaults,
	]);

	// ==============================================
	// DB Operations
	// ==============================================

	/**
	 * Retrieves an email verification token by its ID.
	 */
	const _getVerificationToken = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSEmailVerificationTokens.Select),
		callbackFn: (db, id) =>
			db((client) =>
				client
					.selectFrom('StudioCMSEmailVerificationTokens')
					.selectAll()
					.where('id', '=', id)
					.executeTakeFirst()
			),
	});

	/**
	 * Deletes an email verification token from the database.
	 */
	const _deleteVerificationToken = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, id) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSEmailVerificationTokens')
					.where('userId', '=', id)
					.executeTakeFirst()
			),
	});

	/**
	 * Inserts a new email verification token into the database.
	 */
	const _insertVerificationToken = withCodec({
		encoder: StudioCMSEmailVerificationTokens.Insert,
		decoder: StudioCMSEmailVerificationTokens.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.insertInto('StudioCMSEmailVerificationTokens')
					.values(data)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Creates a new OAuth account in the database.
	 */
	const _createNewOAuthAccount = withCodec({
		encoder: StudioCMSOAuthAccounts.Insert,
		decoder: StudioCMSOAuthAccounts.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.insertInto('StudioCMSOAuthAccounts')
					.values(data)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Deletes an OAuth user account from the database.
	 */
	const _deleteOAuthUserAccount = withEncoder({
		encoder: Schema.Struct({
			userId: Schema.String,
			provider: Schema.String,
		}),
		callbackFn: (db, { userId, provider }) =>
			db((client) =>
				client
					.deleteFrom('StudioCMSOAuthAccounts')
					.where((eb) => eb.and([eb('userId', '=', userId), eb('provider', '=', provider)]))
					.executeTakeFirst()
			),
	});

	/**
	 * Searches for an OAuth account by provider user ID and user ID.
	 */
	const _searchOAuthAccountByProviderId = withCodec({
		encoder: Schema.Struct({
			providerUserId: Schema.String,
			userId: Schema.String,
		}),
		decoder: Schema.UndefinedOr(StudioCMSOAuthAccounts.Select),
		callbackFn: (db, { providerUserId, userId }) =>
			db((client) =>
				client
					.selectFrom('StudioCMSOAuthAccounts')
					.selectAll()
					.where((eb) =>
						eb.and([eb('providerUserId', '=', providerUserId), eb('userId', '=', userId)])
					)
					.executeTakeFirst()
			),
	});

	/**
	 * Searches for OAuth providers for a given user ID.
	 */
	const _searchOauthProvidersForId = withCodec({
		encoder: Schema.Struct({
			providerId: Schema.String,
			userId: Schema.String,
		}),
		decoder: Schema.UndefinedOr(StudioCMSOAuthAccounts.Select),
		callbackFn: (db, { providerId, userId }) =>
			db((client) =>
				client
					.selectFrom('StudioCMSOAuthAccounts')
					.selectAll()
					.where((eb) => eb.and([eb('provider', '=', providerId), eb('userId', '=', userId)]))
					.executeTakeFirst()
			),
	});

	/**
	 * Retrieves the current permission for a user by their ID.
	 */
	const _getCurrentPermission = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSPermissions.Select),
		callbackFn: (db, id) =>
			db((client) =>
				client
					.selectFrom('StudioCMSPermissions')
					.selectAll()
					.where('user', '=', id)
					.executeTakeFirst()
			),
	});

	/**
	 * Creates a new session for a user.
	 */
	const _createNewSession = withCodec({
		encoder: StudioCMSSessionTable.Insert,
		decoder: StudioCMSSessionTable.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.insertInto('StudioCMSSessionTable')
					.values(data)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Retrieves a user by their ID.
	 */
	const _getUserById = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSUsersTable.Select),
		callbackFn: (db, id) =>
			db((client) =>
				client.selectFrom('StudioCMSUsersTable').selectAll().where('id', '=', id).executeTakeFirst()
			),
	});

	/**
	 * Retrieves a user's Session by its ID.
	 */
	const _getSessionById = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSSessionTable.Select),
		callbackFn: (db, id) =>
			db((client) =>
				client
					.selectFrom('StudioCMSSessionTable')
					.selectAll()
					.where('id', '=', id)
					.executeTakeFirst()
			),
	});

	/**
	 * Deletes a session by its ID.
	 */
	const _deleteSession = withEncoder({
		encoder: Schema.String,
		callbackFn: (db, id) =>
			db((client) =>
				client.deleteFrom('StudioCMSSessionTable').where('id', '=', id).executeTakeFirst()
			),
	});

	/**
	 * Updates a session by its ID.
	 */
	const _updateSession = withCodec({
		encoder: Schema.Struct({
			id: Schema.String,
			newDate: Schema.Date,
		}),
		decoder: StudioCMSSessionTable.Select,
		callbackFn: (db, { id, newDate }) =>
			db((client) =>
				client
					.updateTable('StudioCMSSessionTable')
					.set({ expiresAt: newDate })
					.where('id', '=', id)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Creates a new user in the database.
	 */
	const _createNewUser = withCodec({
		encoder: StudioCMSUsersTable.Insert,
		decoder: StudioCMSUsersTable.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.insertInto('StudioCMSUsersTable')
					.values(data)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Creates a new user permission in the database.
	 */
	const _createUserPermission = withCodec({
		encoder: StudioCMSPermissions.Insert,
		decoder: StudioCMSPermissions.Select,
		callbackFn: (db, data) =>
			db((client) =>
				client
					.insertInto('StudioCMSPermissions')
					.values(data)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Updates user data for a specified user.
	 */
	const _updateUserData = withCodec({
		encoder: Schema.Struct({
			userId: Schema.String,
			userData: StudioCMSUsersTable.Update,
		}),
		decoder: StudioCMSUsersTable.Select,
		callbackFn: (db, { userId, userData }) =>
			db((client) =>
				client
					.updateTable('StudioCMSUsersTable')
					.set(userData)
					.where('id', '=', userId)
					.returningAll()
					.executeTakeFirstOrThrow()
			),
	});

	/**
	 * Searches for users by username.
	 */
	const _searchForUsername = withCodec({
		encoder: Schema.String,
		decoder: Schema.Array(StudioCMSUsersTable.Select),
		callbackFn: (db, username) =>
			db((client) =>
				client
					.selectFrom('StudioCMSUsersTable')
					.selectAll()
					.where('username', '=', username)
					.execute()
			),
	});

	/**
	 * Searches for users by email.
	 */
	const _searchForEmail = withCodec({
		encoder: Schema.String,
		decoder: Schema.Array(StudioCMSUsersTable.Select),
		callbackFn: (db, email) =>
			db((client) =>
				client.selectFrom('StudioCMSUsersTable').selectAll().where('email', '=', email).execute()
			),
	});

	// ==============================================
	// Helper Functions
	// ==============================================

	/**
	 * Inserts a new email verification token into the database. (Pipped for Effect chaining)
	 */
	const _pippedInsertToken = (userId: string) =>
		Effect.fn((token: string) =>
			_insertVerificationToken({
				id: crypto.randomUUID(),
				userId,
				token,
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
			})
		);

	/**
	 * Creates a new email verification token in the database.
	 */
	const _createVerificationToken = Effect.fn((userId: string) =>
		generateToken(userId).pipe(
			Effect.tap(() => _deleteVerificationToken(userId)),
			Effect.flatMap(_pippedInsertToken(userId))
		)
	);

	/**
	 * Retrieves a session along with its associated user by session ID.
	 */
	const _getSessionWithUserById = Effect.fn(function* (sessionId: string) {
		const session = yield* _getSessionById(sessionId);
		if (!session) return undefined;

		const user = yield* _getUserById(session.userId);
		if (!user) return undefined;

		return {
			session,
			user,
		};
	});

	/**
	 * Creates a new user with the specified permissions.
	 */
	const _createNewUserWithPermission = Effect.fn(
		(userData: tsUsers['Insert']['Type'], rank: tsPermissions['Insert']['Type']['rank']) =>
			_createNewUser(userData).pipe(
				Effect.tap(({ id: user }) =>
					_createUserPermission({
						user,
						rank,
					})
				)
			)
	);

	/**
	 * Searches for users by username and/or email.
	 */
	const _searchForUsernameOrEmail = Effect.fn(function* (username?: string, email?: string) {
		const usernameSearch: tsUsersSelect[] = [];
		const emailSearch: tsUsersSelect[] = [];

		// Search by username if provided
		if (username) {
			const results = yield* _searchForUsername(username);
			usernameSearch.push(...results);
		}

		// Search by email if provided
		if (email) {
			const results = yield* _searchForEmail(email);
			emailSearch.push(...results);
		}

		return { usernameSearch, emailSearch };
	});

	/**
	 * Verifies the existence of the ghost user.
	 */
	const _verifyGhostUserExists = Effect.fn(() =>
		_getUserById(GhostUserDefaults.id).pipe(Effect.map((user) => !!user))
	);

	/**
	 * Creates the ghost user if it does not already exist.
	 */
	const _createGhostUser = Effect.fn(() =>
		_getUserById(GhostUserDefaults.id).pipe(
			Effect.flatMap((user) =>
				user
					? Effect.succeed(user)
					: _createNewUser({
							...GhostUserDefaults,
							updatedAt: new Date().toISOString(),
							createdAt: new Date().toISOString(),
							emailVerified: false,
						})
			)
		)
	);

	/**
	 * Retrieves the ghost user.
	 */
	const _getGhostUser = Effect.fn(() =>
		_getUserById(GhostUserDefaults.id).pipe(
			Effect.flatMap((user) => (user ? Effect.succeed(user) : _createGhostUser()))
		)
	);

	/**
	 * Catches common DB errors and maps them to structured status/message responses.
	 */
	const _CatchErrs = (capt: string) =>
		Effect.catchTags<DBCallbackFailure | DatabaseError, AuthErrorHandlers>(
			AuthErrorTagsEntries.reduce(
				(acc, tag) => {
					acc[tag] = () =>
						Effect.succeed({
							status: 'error',
							message: `An error occurred while deleting ${capt}`,
						});
					return acc;
				},
				{} as Record<AuthErrorTags, () => AuthDeletionResponse>
			)
		);

	// ==============================================
	// Auth Module Sub-Modules
	// ==============================================

	/**
	 * Module for handling email verification tokens.
	 */
	const verifyEmail = {
		/**
		 * Retrieves an email verification token by its ID.
		 *
		 * @param id - The ID of the email verification token to retrieve.
		 * @returns A promise that resolves to the email verification token if found, otherwise undefined.
		 */
		get: _getVerificationToken,
		/**
		 * Creates a new email verification token in the database.
		 *
		 * @param userId - The ID of the user to create the token for.
		 * @returns A promise that resolves to the created email verification token.
		 */
		create: _createVerificationToken,
		/**
		 * Deletes an email verification token from the database.
		 *
		 * @param userId - The ID of the user associated with the token.
		 * @returns A promise that resolves to the deletion response.
		 */
		delete: _deleteVerificationToken,
	};

	/**
	 * Module for handling OAuth accounts.
	 */
	const oAuth = {
		/**
		 * Creates a new OAuth account in the database.
		 *
		 * @param input - The OAuth account data to create.
		 * @returns A promise that resolves to the created OAuth account.
		 */
		create: _createNewOAuthAccount,

		/**
		 * Deletes an OAuth user account from the database.
		 *
		 * @param input - An object containing the userId and provider of the OAuth account to delete.
		 * @returns A promise that resolves to a status and message indicating the result of the deletion.
		 */
		delete: (input: { readonly userId: string; readonly provider: string }): AuthDeletionResponse =>
			_deleteOAuthUserAccount(input).pipe(
				Effect.flatMap(() =>
					Effect.succeed({
						status: 'success' as const,
						message: 'OAuth account deleted successfully',
					})
				),
				_CatchErrs('OAuth account')
			),

		/**
		 * Searches for an OAuth account by provider user ID and user ID.
		 *
		 * @param input - An object containing the providerUserId and userId to search for.
		 * @returns A promise that resolves to the found OAuth account if it exists, otherwise undefined.
		 */
		searchByProviderId: _searchOAuthAccountByProviderId,

		/**
		 * Searches for OAuth providers for a given user ID.
		 *
		 * @param input - An object containing the providerId and userId to search for.
		 * @returns A promise that resolves to the found OAuth account if it exists, otherwise undefined.
		 */
		searchProvidersForId: _searchOauthProvidersForId,
	};

	/**
	 * Module for handling permissions.
	 */
	const permission = {
		/**
		 * Retrieves the current permission for a user by their ID.
		 *
		 * @param id - The ID of the user whose permission is to be retrieved.
		 * @returns A promise that resolves to the user's permission if found, otherwise undefined.
		 */
		currentStatus: _getCurrentPermission,
	};

	/**
	 * Module for handling sessions.
	 */
	const session = {
		/**
		 * Creates a new session for a user.
		 *
		 * @param data - The session data to create.
		 * @returns A promise that resolves to the created session.
		 */
		create: _createNewSession,

		/**
		 * Retrieves a user's Session by its ID.
		 *
		 * @param id - The ID of the session to retrieve.
		 * @returns A promise that resolves to the session if found, otherwise undefined.
		 */
		getById: _getSessionById,

		/**
		 * Retrieves a session along with its associated user by session ID.
		 *
		 * @param sessionId - The ID of the session to retrieve.
		 * @returns A promise that resolves to an object containing the session and user if found, otherwise undefined.
		 */
		sessionWithUser: _getSessionWithUserById,

		/**
		 * Deletes a session by its ID.
		 *
		 * @param input - The ID of the session to delete.
		 * @returns A promise that resolves to a status and message indicating the result of the deletion.
		 */
		delete: (input: string): AuthDeletionResponse =>
			_deleteSession(input).pipe(
				Effect.flatMap(() =>
					Effect.succeed({ status: 'success' as const, message: 'Session deleted successfully' })
				),
				_CatchErrs('Session')
			),

		/**
		 * Updates a session's expiration date.
		 *
		 * @param input - An object containing the session ID and the new expiration date.
		 * @returns A promise that resolves to the updated session.
		 */
		update: _updateSession,
	};

	/**
	 * Module for handling users.
	 */
	const user = {
		/**
		 * Creates a new user with the specified permissions.
		 *
		 * @param userData - The data for the new user.
		 * @param rank - The permission rank for the new user.
		 * @returns A promise that resolves to the created user.
		 */
		create: _createNewUserWithPermission,

		/**
		 * Updates user data for a specified user.
		 *
		 * @param input - An object containing the userId and the userData to update.
		 * @returns A promise that resolves to the updated user.
		 */
		update: _updateUserData,

		/**
		 * Searches for users by username.
		 *
		 * @param username - The username to search for.
		 * @param email - The email to search for.
		 * @returns A promise that resolves to an array of users matching the username.
		 */
		searchUsersForUsernameOrEmail: _searchForUsernameOrEmail,

		/**
		 * Verifies the existence of the ghost user.
		 *
		 * @returns A promise that resolves to true if the ghost user exists, otherwise false.
		 */
		ghost: {
			/**
			 * Verifies the existence of the ghost user.
			 *
			 * @returns A promise that resolves to true if the ghost user exists, otherwise false.
			 */
			verifyExists: _verifyGhostUserExists,

			/**
			 * Creates the ghost user if it does not already exist.
			 *
			 * @returns A promise that resolves to the ghost user.
			 */
			create: _createGhostUser,

			/**
			 * Retrieves the ghost user.
			 *
			 * @returns A promise that resolves to the ghost user.
			 */
			get: _getGhostUser,
		},
	};

	return {
		verifyEmail,
		oAuth,
		permission,
		session,
		user,
	};
});

export default SDKAuthModule;
