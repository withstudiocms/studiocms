import { Clock, Duration, Effect } from '@withstudiocms/effect';

/**
 * Represents a cache entry with a value, expiration time, and associated tags.
 *
 * @template A - The type of the cached value.
 */
export interface CacheEntry<A> {
	value: A;
	expiresAt: number;
	lastUpdatedAt: number; // Timestamp of last update
	tags: Set<string>; // For tag-based invalidation
}

/**
 * Represents the status of a cache entry, including expiration and tags.
 */
export interface CacheEntryStatus {
	expiresAt: Date;
	lastUpdatedAt: Date;
	tags: Set<string>;
}

/**
 * Error indicating that a requested cache entry was not found.
 */
export class CacheMissError {
	readonly _tag = 'CacheMissError';
}

const returnNonNull = <A>(value: A | null): Effect.Effect<A, CacheMissError> =>
	value !== null ? Effect.succeed(value) : Effect.fail(new CacheMissError());

/**
 * In-memory caching service implemented as an Effect.Service.
 *
 * Provides a small, memory-resident key/value cache with optional per-entry TTL
 * and tag-based invalidation. Designed to be used from Effects; each operation
 * returns an Effect that performs the requested action.
 *
 * @remarks
 * - Storage: entries are stored in a Map keyed by string. Each entry contains:
 *   - value: the cached value (generic)
 *   - expiresAt: absolute expiration time in milliseconds since epoch
 *   - tags: a Set of associated tag strings
 * - Tag index: a separate Map from tag -> Set<key> is maintained to support
 *   fast invalidation of all entries associated with a given tag.
 * - Expiration behavior: entries are checked for expiration lazily. An entry
 *   that has expired will be removed when it is accessed (via get) or when
 *   explicit invalidation/delete/clear is performed. There is no background
 *   eviction thread.
 * - Default TTL: when setting an entry without an explicit ttl option, the
 *   service uses Duration.minutes(5) as the default time-to-live.
 * - Concurrency / process model: this is an in-memory, single-process cache.
 *   It is not persisted and is not safe for cross-process sharing.
 *
 * Public API (high-level):
 * - get<A>(key: string): Effect<..., A | null>
 *   Retrieve the value for a key. Returns null if the key is missing or expired.
 *
 * - set<A>(key: string, value: A, options?: { ttl?: Duration, tags?: string[] }): Effect<..., void>
 *   Store a value with an optional TTL and optional tags. Tags are used for
 *   later invalidation. Existing tag->key index entries are updated.
 *
 * - delete(key: string): Effect<..., void>
 *   Remove a single key and remove its references from the tag index.
 *
 * - invalidateTags(tags: string[]): Effect<..., void>
 *   Invalidate (delete) all keys associated with any of the provided tags and
 *   remove those tags from the tag index.
 *
 * - clear(): Effect<..., void>
 *   Remove all keys and clear the tag index.
 *
 * @example
 * // Pseudocode (Effect-aware)
 * const cache = yield* CacheService; // obtain CacheService from environment
 * yield* cache.set('user:1', userObj, { ttl: Duration.minutes(10), tags: ['users', 'recent'] });
 * const user = yield* cache.get<User>('user:1'); // returns userObj | null
 * yield* cache.invalidateTags(['users']); // removes all entries tagged 'users'
 *
 * @public
 */
export class CacheService extends Effect.Service<CacheService>()(
	'@withstudiocms/sdk/cache/CacheService',
	{
		effect: Effect.gen(function* () {
			const store = new Map<string, CacheEntry<unknown>>();
			const tagIndex = new Map<string, Set<string>>(); // tag -> Set of keys

			/**
			 * Retrieves a value from the cache by key.
			 *
			 * @template A - The type of the cached value.
			 * @param key - The key to retrieve.
			 * @returns An effect that yields the cached value or null if not found/expired.
			 */
			const get = <A>(key: string) =>
				Effect.gen(function* () {
					const now = yield* Clock.currentTimeMillis;
					const entry = store.get(key) as CacheEntry<A> | undefined;

					if (!entry) return null;
					if (entry.expiresAt < now) {
						store.delete(key);
						return null;
					}

					return entry.value;
				});

			/**
			 * Sets a value in the cache with optional TTL and tags.
			 *
			 * @template A - The type of the cached value.
			 * @param key - The key to set.
			 * @param value - The value to cache.
			 * @param options - Optional settings including TTL and tags.
			 * @returns An effect that completes when the value is set.
			 */
			const set = <A>(
				key: string,
				value: A,
				options?: { ttl?: Duration.Duration; tags?: string[] }
			) =>
				Effect.gen(function* () {
					const now = yield* Clock.currentTimeMillis;
					const ttl = options?.ttl ?? Duration.minutes(5);
					const tags = new Set(options?.tags ?? []);

					const expiresAt = now + Duration.toMillis(ttl);
					store.set(key, { value, expiresAt, tags, lastUpdatedAt: now });

					// Update tag index
					for (const tag of tags) {
						if (!tagIndex.has(tag)) {
							tagIndex.set(tag, new Set());
						}
						tagIndex.get(tag)?.add(key);
					}
				});

			/**
			 * Deletes a key from the cache.
			 *
			 * @param key - The key to delete.
			 * @returns An effect that completes when the key is deleted.
			 */
			const deleteKey = (key: string) =>
				Effect.sync(() => {
					const entry = store.get(key);
					if (entry) {
						// Remove from tag index
						for (const tag of entry.tags) {
							tagIndex.get(tag)?.delete(key);
						}
					}
					store.delete(key);
				});

			/**
			 * Invalidates all cache entries associated with the given tags.
			 *
			 * @param tags - The tags to invalidate.
			 * @returns An effect that completes when the tags are invalidated.
			 */
			const invalidateTags = (tags: string[]) =>
				Effect.sync(() => {
					for (const tag of tags) {
						const keys = tagIndex.get(tag);
						if (keys) {
							for (const key of keys) {
								store.delete(key);
							}
							tagIndex.delete(tag);
						}
					}
				});

			/**
			 * Clears the entire cache and tag index.
			 *
			 * @returns An effect that completes when the cache is cleared.
			 */
			const clear = () =>
				Effect.sync(() => {
					store.clear();
					tagIndex.clear();
				});

			/**
			 * Memoizes the result of an effect under a given key with optional TTL and tags.
			 *
			 * @param key - The cache key.
			 * @param effect - The effect to memoize.
			 * @param options - Optional settings including TTL and tags.
			 * @returns An effect that yields the memoized result.
			 */
			const memoize = <A, E, R>(
				key: string,
				effect: Effect.Effect<A, E, R>,
				options?: {
					ttl?: Duration.Duration;
					tags?: string[];
				}
			): Effect.Effect<A, E, R> =>
				get<A>(key).pipe(
					Effect.flatMap(returnNonNull),
					Effect.catchTag('CacheMissError', () =>
						effect.pipe(Effect.tap((result) => set<A>(key, result, options)))
					)
				);

			/**
			 * Retrieves the status of a cache entry by key.
			 *
			 * @param id - The cache key.
			 * @returns An effect that yields the CacheEntryStatus or null if not found.
			 */
			const getCacheStatus = Effect.fn((id: string) =>
				Effect.gen(function* () {
					const now = yield* Clock.currentTimeMillis;
					const entry = store.get(id);
					if (!entry || entry.expiresAt < now) {
						if (entry && entry.expiresAt < now) {
							store.delete(id); // Clean up expired entry
						}
						return null;
					}
					return {
						expiresAt: new Date(entry.expiresAt),
						lastUpdatedAt: new Date(entry.lastUpdatedAt),
						tags: entry.tags,
					};
				})
			);

			return { get, set, delete: deleteKey, invalidateTags, clear, memoize, getCacheStatus };
		}),
	}
) {}

export default CacheService;
