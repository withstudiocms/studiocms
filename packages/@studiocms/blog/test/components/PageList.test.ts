/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { CombinedPageData } from 'studiocms/sdk/types';
import { describe, expect, test } from 'vitest';
import PageList from '../../dist/components/PageList.astro';

describe('PageList component', () => {
	test('PageList renders correctly with no blog posts', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(PageList, {
			props: {
				blogPageList: [] as CombinedPageData[],
			},
		});

		expect(result).toMatch(/<li .*?>No blog posts found<\/li>/);
	});

	test('PageList renders correctly with blog posts', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(PageList, {
			props: {
				blogPageList: [
					{
						slug: 'test-post',
						heroImage: '',
						title: 'Test Post',
						description: 'This is a test post.',
						publishedAt: new Date('2023-01-01T00:00:00Z'),
					},
				] as CombinedPageData[],
			},
		});

		expect(result).toMatch(/<span class="title".*?>Test Post<\/span>/);
		expect(result).toMatch(/<p class="description".*?> This is a test post\. <\/p>/);
	});
});
