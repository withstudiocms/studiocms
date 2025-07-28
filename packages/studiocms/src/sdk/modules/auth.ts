import { and, eq } from 'astro:db';
import { GhostUserDefaults } from '../../consts.js';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB, SDKCore_Generators } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import {
	tsEmailVerificationTokens,
	tsOAuthAccounts,
	tsPermissions,
	tsSessionTable,
	tsUsers,
} from '../tables.js';
import type {
	tsOAuthAccountsSelect,
	tsSessionTableInsert,
	tsUsersInsert,
	tsUsersUpdate,
} from '../types/index.js';
import { _ClearUnknownError, _clearLibSQLError } from '../utils.js';

/**
 * Provides authentication-related operations for the StudioCMS SDK.
 *
 * This service includes methods for managing email verification tokens, OAuth accounts,
 * user permissions, sessions, and users (including ghost users).
 *
 * @remarks
 * All database operations are wrapped with error handling for `LibSQLDatabaseError`,
 * returning a custom `SDKCoreError` with contextual information.
 *
 * @example
 * ```typescript
 * const auth = Effect.runPromise(SDKCore_AUTH.effect);
 * const user = await auth.user.create({ username: 'adam', email: 'adam@example.com' });
 * ```
 *
 * @service
 * @module studiocms/sdk/SDKCore/modules/auth
 *
 * @dependencies
 * - AstroDB.Default
 * - SDKCore_Generators.Default
 *
 * @effect
 * - genLogger('studiocms/sdk/SDKCore/modules/auth/effect')
 *
 * @see SDKCoreError
 * @see StudioCMS_SDK_Error
 */
export class SDKCore_AUTH extends Effect.Service<SDKCore_AUTH>()(
	'studiocms/sdk/SDKCore/modules/auth',
	{
		dependencies: [AstroDB.Default, SDKCore_Generators.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/auth/effect')(function* () {
			const [dbService, { generateToken }] = yield* Effect.all([AstroDB, SDKCore_Generators]);

			const AUTH = {
				verifyEmail: {
					/**
					 * Retrieves an email verification token by its ID.
					 *
					 * @param id - The ID of the email verification token to retrieve.
					 * @returns A promise that resolves to the email verification token if found, otherwise undefined.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while retrieving the token.
					 */
					get: dbService.makeQuery((ex, id: string) =>
						ex((db) =>
							db
								.select()
								.from(tsEmailVerificationTokens)
								.where(eq(tsEmailVerificationTokens.id, id))
								.get()
						).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.verifyEmail.get Error: ${cause}`),
										})
									),
							})
						)
					),
					/**
					 * Creates a new email verification token in the database.
					 *
					 * @param userId - The ID of the user to create the token for.
					 * @returns A promise that resolves to the created email verification token.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the token.
					 */
					create: (userId: string) =>
						Effect.gen(function* () {
							yield* dbService.execute((db) =>
								db
									.delete(tsEmailVerificationTokens)
									.where(eq(tsEmailVerificationTokens.userId, userId))
							);

							const token = yield* generateToken(userId);

							return yield* dbService.execute((db) =>
								db
									.insert(tsEmailVerificationTokens)
									.values({
										// @ts-expect-error Drizzle... removed this from the type?
										id: crypto.randomUUID(),
										userId,
										token,
										expiresAt: new Date(Date.now() + 1000 * 60 * 10),
									})
									.returning()
									.get()
							);
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.verifyEmail.create Error: ${cause}`),
										})
									),
							})
						),
					/**
					 * Deletes an email verification token from the database.
					 *
					 * @param userId - The ID of the user associated with the token.
					 * @returns A promise that resolves to the deletion response.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the token.
					 */
					delete: dbService.makeQuery((ex, userId: string) =>
						ex((db) =>
							db
								.delete(tsEmailVerificationTokens)
								.where(eq(tsEmailVerificationTokens.userId, userId))
						).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.verifyEmail.delete Error: ${cause}`),
										})
									),
							})
						)
					),
				},
				oAuth: {
					/**
					 * Creates a new OAuth account in the database.
					 *
					 * @param data - The data to insert into the OAuth account table.
					 * @returns A promise that resolves to the inserted OAuth account.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the OAuth account.
					 */
					create: dbService.makeQuery((ex, data: tsOAuthAccountsSelect) =>
						ex((db) => db.insert(tsOAuthAccounts).values(data).returning().get()).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.oAuth.create Error: ${cause}`),
										})
									),
							})
						)
					),
					/**
					 * Deletes an OAuth account from the database.
					 *
					 * @param userId - The ID of the user associated with the OAuth account.
					 * @param provider - The provider of the OAuth account.
					 * @returns A promise that resolves to a deletion response.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the OAuth account.
					 */
					delete: (userId: string, provider: string) =>
						Effect.gen(function* () {
							yield* dbService.execute((db) =>
								db
									.delete(tsOAuthAccounts)
									.where(
										and(eq(tsOAuthAccounts.userId, userId), eq(tsOAuthAccounts.provider, provider))
									)
							);

							return {
								status: 'success',
								message: 'OAuth account deleted',
							};
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.oAuth.delete Error: ${cause}`),
										})
									),
							})
						),
					/**
					 * Searches for OAuth accounts based on the provider ID and user ID.
					 *
					 * @param providerId - The provider ID to search for.
					 * @param userId - The user ID to search for.
					 * @returns A promise that resolves to the OAuth account data if found, otherwise undefined.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while searching for the OAuth account.
					 */
					searchProvidersForId: (providerId: string, userId: string) =>
						dbService
							.execute((db) =>
								db
									.select()
									.from(tsOAuthAccounts)
									.where(
										and(
											eq(tsOAuthAccounts.providerUserId, providerId),
											eq(tsOAuthAccounts.userId, userId)
										)
									)
									.get()
							)
							.pipe(
								Effect.catchTags({
									'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
										Effect.fail(
											new SDKCoreError({
												type: 'LibSQLDatabaseError',
												cause: new StudioCMS_SDK_Error(
													`AUTH.oAuth.searchProviderForId Error: ${cause}`
												),
											})
										),
								})
							),
				},
				permission: {
					/**
					 * Checks the current status of a user's permissions.
					 */
					currentStatus: dbService.makeQuery((ex, userId: string) =>
						ex((db) =>
							db.select().from(tsPermissions).where(eq(tsPermissions.user, userId)).get()
						).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`AUTH.permission.currentStatus Error: ${cause}`
											),
										})
									),
							})
						)
					),
				},
				session: {
					/**
					 * Creates a new session in the database.
					 *
					 * @param data - The data to insert into the session table.
					 * @returns A promise that resolves to the inserted session.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the session.
					 */
					create: dbService.makeQuery((ex, data: tsSessionTableInsert) =>
						ex((db) =>
							db
								.insert(tsSessionTable)
								.values(data)
								.returning({
									id: tsSessionTable.id,
									userId: tsSessionTable.userId,
									expiresAt: tsSessionTable.expiresAt,
								})
								.get()
						).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.session.create Error: ${cause}`),
										})
									),
							})
						)
					),
					/**
					 * Gets a session with the associated user.
					 *
					 * @param sessionId - The ID of the session to search for.
					 * @returns A promise that resolves to the session with the associated user.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the session with the user.
					 */
					sessionWithUser: dbService.makeQuery((ex, sessionId: string) =>
						ex((db) =>
							db
								.select({ user: tsUsers, session: tsSessionTable })
								.from(tsSessionTable)
								.innerJoin(tsUsers, eq(tsSessionTable.userId, tsUsers.id))
								.where(eq(tsSessionTable.id, sessionId))
						).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`AUTH.session.sessionWithUser Error: ${cause}`
											),
										})
									),
							})
						)
					),
					/**
					 * Deletes a session from the database.
					 *
					 * @param sessionId - The ID of the session to delete.
					 * @returns A promise that resolves to a deletion response.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while deleting the session.
					 */
					delete: dbService.makeQuery((ex, sessionId: string) =>
						ex((db) => db.delete(tsSessionTable).where(eq(tsSessionTable.id, sessionId))).pipe(
							Effect.map(() => ({
								status: 'success',
								message: 'Session deleted',
							})),
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.session.delete Error: ${cause}`),
										})
									),
							})
						)
					),
					/**
					 * Updates the expiration date of a session.
					 *
					 * @param sessionId - The ID of the session to update.
					 * @param newDate - The new expiration date for the session.
					 * @returns A promise that resolves to the updated session.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the session.
					 */
					update: (sessionId: string, newDate: Date) =>
						dbService
							.execute((db) =>
								db
									.update(tsSessionTable)
									.set({ expiresAt: newDate })
									.where(eq(tsSessionTable.id, sessionId))
									.returning()
							)
							.pipe(
								Effect.catchTags({
									'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
										Effect.fail(
											new SDKCoreError({
												type: 'LibSQLDatabaseError',
												cause: new StudioCMS_SDK_Error(`AUTH.session.update Error: ${cause}`),
											})
										),
								})
							),
				},
				user: {
					/**
					 * Creates a new user in the database.
					 *
					 * @param newUserData - The data to insert into the users table.
					 * @returns A promise that resolves to the inserted user.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the user.
					 */
					create: (newUserData: tsUsersInsert, rank?: 'visitor' | 'editor' | 'admin' | 'owner') =>
						Effect.gen(function* () {
							const newUser = yield* dbService.execute((db) =>
								db.insert(tsUsers).values(newUserData).returning().get()
							);
							yield* dbService.execute((db) =>
								db.insert(tsPermissions).values({ user: newUser.id, rank: rank || 'visitor' })
							);
							return newUser;
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(`AUTH.user.create Error: ${cause}`),
										})
									),
							})
						),
					/**
					 * Updates a user in the database.
					 *
					 * @param userId - The ID of the user to update.
					 * @param userData - The data to update the user with.
					 * @returns A promise that resolves to the updated user.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while updating the user.
					 */
					update: (userId: string, userData: tsUsersUpdate) =>
						dbService
							.execute((db) =>
								db.update(tsUsers).set(userData).where(eq(tsUsers.id, userId)).returning().get()
							)
							.pipe(
								Effect.catchTags({
									'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
										Effect.fail(
											new SDKCoreError({
												type: 'LibSQLDatabaseError',
												cause: new StudioCMS_SDK_Error(`AUTH.user.update Error: ${cause}`),
											})
										),
								})
							),
					/**
					 * Searches for users based on the provided username or email.
					 *
					 * @param username - The username to search for.
					 * @param email - The email to search for.
					 * @returns A promise that resolves to an object containing the search results for the username and email.
					 * @throws {StudioCMS_SDK_Error} If an error occurs while searching for the username or email.
					 */
					searchUsersForUsernameOrEmail: (username = '', email = '') =>
						Effect.gen(function* () {
							const usernameSearch = yield* dbService.execute((db) =>
								db.select().from(tsUsers).where(eq(tsUsers.username, username))
							);
							const emailSearch = yield* dbService.execute((db) =>
								db.select().from(tsUsers).where(eq(tsUsers.email, email))
							);

							return { usernameSearch, emailSearch };
						}).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									Effect.fail(
										new SDKCoreError({
											type: 'LibSQLDatabaseError',
											cause: new StudioCMS_SDK_Error(
												`AUTH.user.searchUsersForUsernameOrEmail Error: ${cause}`
											),
										})
									),
							})
						),
					ghost: {
						/**
						 * Verifies if the ghost user exists in the database.
						 *
						 * @returns A promise that resolves to a boolean indicating if the ghost user exists.
						 * @throws {StudioCMS_SDK_Error} If an error occurs while verifying the ghost user.
						 */
						verifyExists: () =>
							Effect.gen(function* () {
								const ghostUser = yield* dbService.execute((db) =>
									db.select().from(tsUsers).where(eq(tsUsers.id, GhostUserDefaults.id)).get()
								);
								if (!ghostUser) return false;
								return true;
							}).pipe(
								Effect.catchTags({
									'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
										Effect.fail(
											new SDKCoreError({
												type: 'LibSQLDatabaseError',
												cause: new StudioCMS_SDK_Error(
													`AUTH.user.ghost.verifyExists Error: ${cause}`
												),
											})
										),
								})
							),
						/**
						 * Creates the ghost user in the database.
						 *
						 * @returns A promise that resolves to the inserted ghost user.
						 * @throws {StudioCMS_SDK_Error} If an error occurs while creating the ghost user.
						 */
						create: () =>
							dbService
								.execute((db) => db.insert(tsUsers).values(GhostUserDefaults).returning().get())
								.pipe(
									Effect.catchTags({
										'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
											Effect.fail(
												new SDKCoreError({
													type: 'LibSQLDatabaseError',
													cause: new StudioCMS_SDK_Error(`AUTH.user.ghost.create Error: ${cause}`),
												})
											),
									})
								),
						/**
						 * Gets the ghost user from the database.
						 *
						 * @returns A promise that resolves to the ghost user.
						 * @throws {StudioCMS_SDK_Error} If an error occurs while getting the ghost user.
						 */
						get: () =>
							dbService
								.execute((db) =>
									db.select().from(tsUsers).where(eq(tsUsers.id, GhostUserDefaults.id)).get()
								)
								.pipe(
									Effect.catchTags({
										'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
											Effect.fail(
												new SDKCoreError({
													type: 'LibSQLDatabaseError',
													cause: new StudioCMS_SDK_Error(`AUTH.user.ghost.get Error: ${cause}`),
												})
											),
									})
								),
					},
				},
			};

			return AUTH;
		}),
	}
) {}
