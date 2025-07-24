import { and, eq } from 'astro:db';
import { Effect, genLogger } from '../../effect.js';
import { AstroDB, SDKCore_Generators } from '../effect/index.js';
import { tsAPIKeys, tsPermissions } from '../tables.js';
import { _ClearUnknownError, _clearLibSQLError } from '../utils.js';

export class SDKCore_REST_API extends Effect.Service<SDKCore_REST_API>()(
	'studiocms/sdk/SDKCore/modules/rest_api',
	{
		dependencies: [AstroDB.Default, SDKCore_Generators.Default],
		effect: genLogger('studiocms/sdk/SDKCore/modules/rest_api/effect')(function* () {
			const [dbService, { generateToken }] = yield* Effect.all([AstroDB, SDKCore_Generators]);

			const REST_API = {
				tokens: {
					get: dbService.makeQuery((ex, userId: string) =>
						ex((db) => db.select().from(tsAPIKeys).where(eq(tsAPIKeys.userId, userId))).pipe(
							Effect.catchTags({
								'studiocms/sdk/effect/db/LibSQLDatabaseError': (cause) =>
									_clearLibSQLError('REST_API.tokens.get', cause),
							})
						)
					),
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
