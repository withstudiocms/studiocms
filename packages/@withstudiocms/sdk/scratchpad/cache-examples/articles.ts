/** biome-ignore-all lint/suspicious/noExplicitAny: Allowed for scratchpad examples */
import { Context, Duration, Effect } from '@withstudiocms/effect';
import { CacheService } from '../../src/cache';

// Example: Article repository with caching
interface Article {
	id: string;
	title: string;
	content: string;
	authorId: string;
	categoryId: string;
}

interface ArticleRepository {
	findById: (id: string) => Effect.Effect<Article | null, unknown, unknown>;
	findByAuthor: (authorId: string) => Effect.Effect<Article[], unknown, unknown>;
	findByCategory: (categoryId: string) => Effect.Effect<Article[], unknown, unknown>;
	insert: (article: Omit<Article, 'id'>) => Effect.Effect<Article, unknown, unknown>;
	update: (id: string, data: Partial<Article>) => Effect.Effect<Article, unknown, unknown>;
	delete: (id: string) => Effect.Effect<void, unknown, unknown>;
}

const ArticleRepository = Context.GenericTag<ArticleRepository>('ArticleRepository');

// Implementation with cache
export const makeArticleRepository = (db: any) =>
	Effect.gen(function* () {
		const cache = yield* CacheService;

		const findById = (id: string) =>
			Effect.gen(function* () {
				const cacheKey = `article:${id}`;

				// Try cache first
				const cached = yield* cache.get<Article>(cacheKey);
				if (cached) return cached;

				// Fetch from DB
				const article = yield* db.query('SELECT * FROM articles WHERE id = ?', [id]);

				if (!article) return null;

				// Cache with tags
				yield* cache.set(cacheKey, article, {
					ttl: Duration.minutes(10),
					tags: [`article:${id}`, `author:${article.authorId}`, `category:${article.categoryId}`],
				});

				return article as Article;
			});

		const findByAuthor = (authorId: string) =>
			Effect.gen(function* () {
				const cacheKey = `articles:author:${authorId}`;

				const cached = yield* cache.get<Article[]>(cacheKey);
				if (cached) return cached;

				const articles = yield* db.query('SELECT * FROM articles WHERE authorId = ?', [authorId]);

				yield* cache.set(cacheKey, articles, {
					ttl: Duration.minutes(5),
					tags: [`author:${authorId}`],
				});

				return articles as Article[];
			});

		const findByCategory = (categoryId: string) =>
			Effect.gen(function* () {
				const cacheKey = `articles:category:${categoryId}`;

				const cached = yield* cache.get<Article[]>(cacheKey);
				if (cached) return cached;

				const articles = yield* db.query('SELECT * FROM articles WHERE categoryId = ?', [
					categoryId,
				]);

				yield* cache.set(cacheKey, articles, {
					ttl: Duration.minutes(5),
					tags: [`category:${categoryId}`],
				});

				return articles as Article[];
			});

		const insert = (data: Omit<Article, 'id'>) =>
			Effect.gen(function* () {
				const article = yield* db.insert('articles', data);

				// Invalidate related caches
				yield* cache.invalidateTags([
					`author:${article.authorId}`,
					`category:${article.categoryId}`,
				]);

				return article as Article;
			});

		const update = (id: string, data: Partial<Article>) =>
			Effect.gen(function* () {
				// Get old article to know what to invalidate
				const oldArticle = yield* findById(id);

				const updated = yield* db.update('articles', id, data);

				// Invalidate all related caches
				const tagsToInvalidate = [
					`article:${id}`,
					`author:${updated.authorId}`,
					`category:${updated.categoryId}`,
				];

				// If author or category changed, invalidate old ones too
				if (oldArticle) {
					if (oldArticle.authorId !== updated.authorId) {
						tagsToInvalidate.push(`author:${oldArticle.authorId}`);
					}
					if (oldArticle.categoryId !== updated.categoryId) {
						tagsToInvalidate.push(`category:${oldArticle.categoryId}`);
					}
				}

				yield* cache.invalidateTags(tagsToInvalidate);

				return updated as Article;
			});

		const deleteArticle = (id: string) =>
			Effect.gen(function* () {
				const article = yield* findById(id);

				yield* db.delete('articles', id);

				if (article) {
					yield* cache.invalidateTags([
						`article:${id}`,
						`author:${article.authorId}`,
						`category:${article.categoryId}`,
					]);
				}
			});

		return ArticleRepository.of({
			findById,
			findByAuthor,
			findByCategory,
			insert,
			update,
			delete: deleteArticle,
		});
	});
