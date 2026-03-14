/// <reference types="astro/client" />
import * as allure from 'allure-js-commons';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { CombinedPageData } from 'studiocms/sdk/types';
import { describe, expect, test } from 'vitest';
import BaseHead from '../../src/components/BaseHead.astro';
import Editor from '../../src/components/editor.astro';
import Footer from '../../src/components/Footer.astro';
import Navigation from '../../src/components/Navigation.astro';
import PageList from '../../src/components/PageList.astro';
import PostHeader from '../../src/components/PostHeader.astro';
import RSSIcon from '../../src/components/RSSIcon.astro';
import { MockAstroLocals, parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Component Tests';

describe(parentSuiteName, () => {
	test('RSSIcon renders correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('RSSIcon Component Tests');
		await allure.tags(...sharedTags);

		const container = await AstroContainer.create();
		const result = await container.renderToString(RSSIcon);

		await allure.step('Verifying rendered SVG structure and content', async (ctx) => {
			await ctx.parameter('Rendered Output', result);

			expect(result).toMatch(
				/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="32" height="32" viewBox="0 0 24 24".*?>/
			);
			expect(result).toMatch(
				/<path fill="currentColor" d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93z".*?><\/path>/
			);
			expect(result).toMatch(/<\/svg>/);
		});
	});

	test('PostHeader renders correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('PostHeader Component Tests');
		await allure.tags(...sharedTags);

		const container = await AstroContainer.create();
		const result = await container.renderToString(PostHeader, {
			props: {
				title: 'Test Post',
				description: 'This is a test post description.',
				publishedAt: new Date('2023-01-01T00:00:00Z'),
			},
		});

		await allure.step('Verifying rendered HTML structure and content', async (ctx) => {
			await ctx.parameter('Rendered Output', result);

			expect(result).toMatch(/<h1 class="title".*?>Test Post<\/h1>/);
			expect(result).toMatch(/<p class="description".*?>This is a test post description\.<\/p>/);
			expect(result).toMatch(
				/<p class="date".*?>Published: <time datetime="2023-01-01T00:00:00.000Z".*?>.*?<\/time><\/p>/
			);
		});
	});

	test('PageList renders correctly with blog posts', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('PageList Component Tests');
		await allure.tags(...sharedTags);

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

		await allure.step('Verifying rendered HTML structure and content', async (ctx) => {
			await ctx.parameter('Rendered Output', result);

			expect(result).toMatch(/<span class="title".*?>Test Post<\/span>/);
			expect(result).toMatch(/<p class="description".*?> This is a test post\. <\/p>/);
		});
	});

	test('PageList renders correctly with no blog posts', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('PageList Component Tests');
		await allure.tags(...sharedTags);

		const container = await AstroContainer.create();
		const result = await container.renderToString(PageList, {
			props: {
				blogPageList: [] as CombinedPageData[],
			},
		});

		await allure.step('Verifying rendered HTML structure and content', async (ctx) => {
			await ctx.parameter('Rendered Output', result);

			expect(result).toMatch(/<li .*?>No blog posts found<\/li>/);
		});
	});

	test('Navigation renders correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Navigation Component Tests');
		await allure.tags(...sharedTags);

		const container = await AstroContainer.create();
		const result = await container.renderToString(Navigation, {
			locals: MockAstroLocals(),
		});

		await allure.step('Verifying rendered HTML structure and content', async (ctx) => {
			await ctx.parameter('Rendered Output', result);

			expect(result).toMatch(/<div class="navigation".*?>/);
			expect(result).toMatch(/<a href="\/".*?>Test Site<\/a>/);

			expect(result).toMatch(/<div class="mini-nav".*?>/);
			expect(result).toMatch(/<a class="links" href="\/".*?>Home<\/a>/);
			expect(result).toMatch(/<a class="links" href="\/blog".*?>Blog<\/a>/);
		});
	});

	test('Footer renders correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Footer Component Tests');
		await allure.tags(...sharedTags);

		const container = await AstroContainer.create();
		const result = await container.renderToString(Footer, {
			props: { siteTitle: 'Test Site' },
		});

		await allure.step('Verifying rendered HTML structure and content', async (ctx) => {
			await ctx.parameter('Rendered Output', result);

			const footerRegex =
				/<footer.*?>[\s\S]*?<span id="footer-year".*?>\d{4}<\/span> Test Site\. All rights reserved\.[\s\S]*?<\/footer>/;
			expect(result).toMatch(footerRegex);
		});
	});

	test('BaseHead renders correctly with minimal props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('BaseHead Component Tests');
		await allure.tags(...sharedTags);

		const container = await AstroContainer.create();
		const result = await container.renderToString(BaseHead, {
			props: {
				title: 'Test Title',
				description: 'Test Description',
			},
		});

		await allure.step('Verifying rendered HTML structure and content', async (ctx) => {
			await ctx.parameter('Rendered Output', result);

			expect(result).toContain('<title>Test Title</title>');
			expect(result).toContain('<meta name="description" content="Test Description"/>');
			expect(result).toContain('<meta property="og:title" content="Test Title"/>');
			expect(result).toContain('<meta property="og:description" content="Test Description"/>');
			expect(result).toContain('<meta name="twitter:title" content="Test Title"/>');
			expect(result).toContain('<meta name="twitter:description" content="Test Description"/>');
			expect(result).toContain('<meta name="generator" content="StudioCMS v0.0.0-test"/>');
			expect(result).toContain('<meta name="generator" content="Astro');
			expect(result).toContain('<meta property="og:locale" content="en"/>');
		});
	});

	test('BaseHead renders correctly with all props', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('BaseHead Component Tests');
		await allure.tags(...sharedTags);

		const container = await AstroContainer.create();
		const result = await container.renderToString(BaseHead, {
			props: {
				title: 'Full Test Title',
				description: 'Full Test Description',
				image: 'https://example.com/test-image.png',
				lang: 'fr',
			},
		});

		await allure.step('Verifying rendered HTML structure and content', async (ctx) => {
			await ctx.parameter('Rendered Output', result);

			expect(result).toContain('<title>Full Test Title</title>');
			expect(result).toContain('<meta name="description" content="Full Test Description"/>');
			expect(result).toContain('<meta property="og:title" content="Full Test Title"/>');

			expect(result).toContain('<meta property="og:description" content="Full Test Description"/>');
			expect(result).toContain(
				'<meta property="og:image" content="https://example.com/test-image.png"/>'
			);
			expect(result).toContain('<meta name="twitter:title" content="Full Test Title"/>');
			expect(result).toContain(
				'<meta name="twitter:description" content="Full Test Description"/>'
			);
			expect(result).toContain(
				'<meta name="twitter:image" content="https://example.com/test-image.png"/>'
			);
			expect(result).toContain('<meta property="og:locale" content="fr"/>');
		});
	});

	test('Editor component renders correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Editor Component Tests');
		await allure.tags(...sharedTags);

		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: 'Editor content',
			},
		});

		await allure.step('Verifying rendered HTML structure and content', async (ctx) => {
			await ctx.parameter('Rendered Output', result);

			expect(result).toContain('<div class="editor-container"');
			expect(result).toMatch(
				/<textarea[^>]*id="page-content"[^>]*name="page-content"[^>]*>[\s\S]*Editor content[\s\S]*<\/textarea>/
			);
			expect(result).toMatch(/<script\s+type="module"\s+src=.*?><\/script>/);
		});
	});
});
