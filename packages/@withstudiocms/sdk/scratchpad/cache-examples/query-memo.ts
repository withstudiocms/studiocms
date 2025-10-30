/** biome-ignore-all lint/suspicious/noExplicitAny: Allowed for scratchpad examples */
import { Duration, Effect } from '@withstudiocms/effect';
import { CacheService } from '../../src/cache';

const db = {} as any;

// Helper for query memoization with tags
export const memoizeQuery = <A, E, R>(
	key: string,
	query: Effect.Effect<A, E, R>,
	options?: {
		ttl?: Duration.Duration;
		tags?: string[];
	}
): Effect.Effect<A, E, R> =>
	Effect.gen(function* () {
		const cache = yield* CacheService;

		const cached = yield* cache.get<A>(key);
		if (cached !== null) return cached;

		const result = yield* query;
		yield* cache.set(key, result, options);
		return result;
	}).pipe(Effect.provide(CacheService.Default));

// Usage
export const getArticle = (id: string) =>
	memoizeQuery(`article:${id}`, db.query('SELECT * FROM articles WHERE id = ?', [id]), {
		ttl: Duration.minutes(10),
		tags: [`article:${id}`],
	});

// After update
export const updateArticle = (id: string, data: Partial<{ foo: string }>) =>
	Effect.gen(function* () {
		const cache = yield* CacheService;
		const result = yield* db.update('articles', id, data);

		// Invalidate all article-related caches
		yield* cache.invalidateTags([`article:${id}`]);

		return result;
	});
