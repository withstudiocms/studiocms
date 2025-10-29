import { Clock, Duration, Effect } from '@withstudiocms/effect';

interface CacheEntry<A> {
	value: A;
	expiresAt: number;
	tags: Set<string>; // For tag-based invalidation
}

export class CacheService extends Effect.Service<CacheService>()(
	'@withstudiocms/sdk/cache/CacheService',
	{
		effect: Effect.gen(function* () {
			const store = new Map<string, CacheEntry<unknown>>();
			const tagIndex = new Map<string, Set<string>>(); // tag -> Set of keys

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
					store.set(key, { value, expiresAt, tags });

					// Update tag index
					for (const tag of tags) {
						if (!tagIndex.has(tag)) {
							tagIndex.set(tag, new Set());
						}
						tagIndex.get(tag)?.add(key);
					}
				});

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

			const clear = () =>
				Effect.sync(() => {
					store.clear();
					tagIndex.clear();
				});

			return { get, set, delete: deleteKey, invalidateTags, clear };
		}),
	}
) {}
