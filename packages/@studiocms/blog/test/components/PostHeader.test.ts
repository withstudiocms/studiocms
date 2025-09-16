/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import PostHeader from '../../dist/components/PostHeader.astro';

describe('PostHeader component', () => {
	test('PostHeader renders correctly', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(PostHeader, {
			props: {
				title: 'Test Post',
				description: 'This is a test post description.',
				publishedAt: new Date('2023-01-01T00:00:00Z'),
			},
		});

		expect(result).toMatch(/<h1 class="title".*?>Test Post<\/h1>/);
		expect(result).toMatch(/<p class="description".*?>This is a test post description\.<\/p>/);
		expect(result).toMatch(
			/<p class="date".*?>Published: <time datetime="2023-01-01T00:00:00.000Z".*?>December 31, 2022<\/time><\/p>/
		);
	});
});
