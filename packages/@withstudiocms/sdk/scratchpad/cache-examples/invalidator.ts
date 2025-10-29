import { Effect } from '@withstudiocms/effect';
import { CacheService } from '../../src/cache';

const db = {} as any;

interface Article {
	id: string;
	title: string;
	content: string;
	authorId: string;
	categoryId: string;
}

// Define cache tag strategies
const CacheTags = {
	article: (id: string) => [`article:${id}`],

	articlesByAuthor: (authorId: string) => [`author:${authorId}`],

	articlesByCategory: (categoryId: string) => [`category:${categoryId}`],

	// When article changes, invalidate all related
	onArticleChange: (article: Article) => [
		`article:${article.id}`,
		`author:${article.authorId}`,
		`category:${article.categoryId}`,
	],
};

// Use in operations
const updateArticle = (id: string, data: Partial<Article>) =>
	Effect.gen(function* () {
		const cache = yield* CacheService;
		const updated = yield* db.update('articles', id, data);

		yield* cache.invalidateTags(CacheTags.onArticleChange(updated));

		return updated;
	});
