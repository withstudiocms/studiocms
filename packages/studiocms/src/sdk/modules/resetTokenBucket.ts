import { eq } from 'astro:db';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB, SDKCore_Generators, SDKCore_Users } from '../effect/index.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import { tsUserResetTokens } from '../tables.js';
import type { tsUserResetTokensSelect } from '../types/index.js';
import { _ClearUnknownError, _clearLibSQLError } from '../utils.js';
import { SDKCore_UPDATE } from './update.js';

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
				new: (userId: string): Effect.Effect<tsUserResetTokensSelect, SDKCoreError, never> =>
					Effect.gen(function* () {
						const token = yield* generateToken(userId);

						return yield* dbService.execute((db) =>
							db
								.insert(tsUserResetTokens)
								// @ts-expect-error Drizzle... removed this from the type?
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
