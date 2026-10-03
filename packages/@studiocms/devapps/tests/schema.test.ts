import { describe, expect, test } from '@effect/vitest';
import * as allure from 'allure-js-commons';
import { Schema } from 'studiocms/effect';
import {
	Category,
	MetaDataSchema,
	NumberArray,
	OpenClosedSchema,
	Page,
	Post,
	PostFormatSchema,
	RenderedData,
	RenderedProtectData,
	SiteSettings,
	StatusSchema,
	Tag,
} from '../src/effects/WordPressAPI/schema';
import { parentSuiteName, sharedTags } from './test-utils.js';

const localSuiteName = 'WordPress API Schema Tests';

describe(parentSuiteName, () => {
	['open', 'closed', ''].forEach((value) => {
		test(`OpenClosedSchema should validate value: "${value}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('OpenClosedSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Validating OpenClosedSchema with value: "${value}"`, async (ctx) => {
				const result = Schema.decodeUnknownSync(OpenClosedSchema)(value);

				await ctx.parameter('value', value);
				await ctx.parameter('result', result);

				expect(result).toBe(value);
			});
		});
	});

	['invalid', 'active', 'inactive', null, undefined].forEach((value) => {
		test(`OpenClosedSchema should reject invalid value: "${value}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('OpenClosedSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`Validating OpenClosedSchema with invalid value: "${value}"`,
				async (ctx) => {
					await ctx.parameter('value', String(value));

					expect(() => {
						Schema.decodeUnknownSync(OpenClosedSchema)(value);
					}).toThrow();
				}
			);
		});
	});

	['publish', 'future', 'draft', 'pending', 'private'].forEach((value) => {
		test(`StatusSchema should validate value: "${value}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('StatusSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Validating StatusSchema with value: "${value}"`, async (ctx) => {
				const result = Schema.decodeUnknownSync(StatusSchema)(value);

				await ctx.parameter('value', value);
				await ctx.parameter('result', result);

				expect(result).toBe(value);
			});
		});
	});

	['invalid', 'active', 'inactive', 'archived', null, undefined].forEach((value) => {
		test(`StatusSchema should reject invalid value: "${value}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('StatusSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Validating StatusSchema with invalid value: "${value}"`, async (ctx) => {
				await ctx.parameter('value', String(value));

				expect(() => {
					Schema.decodeUnknownSync(StatusSchema)(value);
				}).toThrow();
			});
		});
	});

	[
		'standard',
		'aside',
		'chat',
		'gallery',
		'link',
		'image',
		'quote',
		'status',
		'video',
		'audio',
		'',
	].forEach((value) => {
		test(`PostFormatSchema should validate value: "${value}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('PostFormatSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Validating PostFormatSchema with value: "${value}"`, async (ctx) => {
				const result = Schema.decodeUnknownSync(PostFormatSchema)(value);

				await ctx.parameter('value', value);
				await ctx.parameter('result', result);

				expect(result).toBe(value);
			});
		});
	});

	['invalid', 'custom', 'blog', null, undefined].forEach((value) => {
		test(`PostFormatSchema should reject invalid value: "${value}"`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('PostFormatSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`Validating PostFormatSchema with invalid value: "${value}"`,
				async (ctx) => {
					await ctx.parameter('value', String(value));

					expect(() => {
						Schema.decodeUnknownSync(PostFormatSchema)(value);
					}).toThrow();
				}
			);
		});
	});

	[
		{
			input: [
				{ key: 'test', value: 'value' },
				{ key: 'number', value: 123 },
				{ key: 'boolean', value: true },
			],
		},
		{
			input: [],
		},
	].forEach(({ input }) => {
		test(`MetaDataSchema should validate input: ${JSON.stringify(input)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('MetaDataSchema Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`Validating MetaDataSchema with input: ${JSON.stringify(input)}`,
				async (ctx) => {
					const result = Schema.decodeUnknownSync(MetaDataSchema)(input);

					await ctx.parameter('input', JSON.stringify(input, null, 2));
					await ctx.parameter('result', JSON.stringify(result, null, 2));

					expect(result).toEqual(input);
				}
			);
		});
	});

	test('MetaDataSchema should reject invalid inputs', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('MetaDataSchema Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating MetaDataSchema with invalid inputs', async (ctx) => {
			const invalidMetadata = [{ invalid: 'structure' }, 'not an object', { key: 'missing value' }];

			await ctx.parameter('invalidInputs', JSON.stringify(invalidMetadata, null, 2));

			invalidMetadata.forEach((metadata) => {
				expect(() => {
					Schema.decodeUnknownSync(MetaDataSchema)(metadata);
				}).toThrow();
			});
		});
	});

	test('RenderedData should validate rendered data structure', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('RenderedData Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating RenderedData with non-object inputs', async (ctx) => {
			const validData = { rendered: 'Some HTML content' };

			const result = Schema.decodeUnknownSync(RenderedData)(validData);

			await ctx.parameter('input', JSON.stringify(validData, null, 2));
			await ctx.parameter('result', JSON.stringify(result, null, 2));

			expect(result).toEqual(validData);
		});
	});

	test('RenderedData should reject data without rendered field', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('RenderedData Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating RenderedData with invalid inputs', async (ctx) => {
			const invalidData = { content: 'Some content' };

			await ctx.parameter('input', JSON.stringify(invalidData, null, 2));

			expect(() => {
				Schema.decodeUnknownSync(RenderedData)(invalidData);
			}).toThrow();
		});
	});

	test('RenderedProtectData should validate rendered protected data structure', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('RenderedProtectData Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating RenderedProtectData with valid inputs', async (ctx) => {
			const validData = {
				rendered: 'Some HTML content',
				protected: true,
			};

			const result = Schema.decodeUnknownSync(RenderedProtectData)(validData);

			await ctx.parameter('input', JSON.stringify(validData, null, 2));
			await ctx.parameter('result', JSON.stringify(result, null, 2));

			expect(result).toEqual(validData);
		});
	});

	test('RenderedProtectData should reject data without required fields', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('RenderedProtectData Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating RenderedProtectData with invalid inputs', async (ctx) => {
			const invalidData = { rendered: 'Some content' }; // missing protected field

			await ctx.parameter('input', JSON.stringify(invalidData, null, 2));

			expect(() => {
				Schema.decodeUnknownSync(RenderedProtectData)(invalidData);
			}).toThrow();
		});
	});

	[[1, 2, 3, 4, 5], []].forEach((input) => {
		test(`NumberArray should validate input: ${JSON.stringify(input)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('NumberArray Tests');
			await allure.tags(...sharedTags);

			await allure.step(
				`Validating NumberArray with input: ${JSON.stringify(input)}`,
				async (ctx) => {
					const result = Schema.decodeUnknownSync(NumberArray)(input);

					await ctx.parameter('input', JSON.stringify(input, null, 2));
					await ctx.parameter('result', JSON.stringify(result, null, 2));

					expect(result).toEqual(input);
				}
			);
		});
	});

	test('NumberArray should reject invalid inputs', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('NumberArray Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating NumberArray with invalid inputs', async (ctx) => {
			const invalidArrays = [[1, '2', 3], [true, false], [1, 2, null], 'not an array', 123, {}];

			await ctx.parameter('invalidInputs', JSON.stringify(invalidArrays, null, 2));

			invalidArrays.forEach((input) => {
				expect(() => {
					Schema.decodeUnknownSync(NumberArray)(input);
				}).toThrow();
			});
		});
	});

	test('Page - should validate complete page data', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Page Schema Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating Page with complete data', async (ctx) => {
			const validPage = {
				id: 1,
				date: '2023-01-01T00:00:00',
				date_gmt: '2023-01-01T00:00:00',
				guid: { rendered: 'http://example.com/page-1' },
				modified: '2023-01-01T00:00:00',
				modified_gmt: '2023-01-01T00:00:00',
				slug: 'test-page',
				status: 'publish',
				type: 'page',
				title: { rendered: 'Test Page' },
				content: { rendered: 'Page content', protected: false },
				excerpt: { rendered: 'Page excerpt', protected: false },
				author: 1,
				featured_media: 0,
				parent: 0,
				menu_order: 0,
				comment_status: 'open',
				ping_status: 'open',
				template: '',
				meta: [],
			};

			await ctx.parameter('input', JSON.stringify(validPage, null, 2));

			const result = Schema.decodeUnknownSync(Page)(validPage);

			await ctx.parameter('result', JSON.stringify(result, null, 2));

			// Check that the result is a Page instance with correct data
			expect(result).toBeInstanceOf(Page);
			expect(result.id).toBe(1);
			expect(result.slug).toBe('test-page');
			expect(result.status).toBe('publish');
		});
	});

	test('Page - should reject page data with missing required fields', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Page Schema Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating Page with missing required fields', async (ctx) => {
			const invalidPage = {
				id: 1,
				// missing required fields
			};

			await ctx.parameter('input', JSON.stringify(invalidPage, null, 2));

			expect(() => {
				Schema.decodeUnknownSync(Page)(invalidPage);
			}).toThrow();
		});
	});

	test('Post - should validate complete post data', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Post Schema Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating Post with complete data', async (ctx) => {
			const validPost = {
				id: 1,
				date: '2023-01-01T00:00:00',
				date_gmt: '2023-01-01T00:00:00',
				guid: { rendered: 'http://example.com/post-1' },
				modified: '2023-01-01T00:00:00',
				modified_gmt: '2023-01-01T00:00:00',
				slug: 'test-post',
				status: 'publish',
				type: 'post',
				title: { rendered: 'Test Post' },
				content: { rendered: 'Post content', protected: false },
				excerpt: { rendered: 'Post excerpt', protected: false },
				author: 1,
				featured_media: 0,
				parent: 0, // Required field from Page
				menu_order: 0,
				comment_status: 'open',
				ping_status: 'open',
				template: '',
				format: 'standard',
				meta: [],
				categories: [1, 2],
				tags: [3, 4],
			};

			await ctx.parameter('input', JSON.stringify(validPost, null, 2));

			const result = Schema.decodeUnknownSync(Post)(validPost);

			await ctx.parameter('result', JSON.stringify(result, null, 2));

			expect(result).toBeInstanceOf(Post);
			expect(result.id).toBe(1);
			expect(result.slug).toBe('test-post');
			expect(result.format).toBe('standard');
		});
	});

	test('Post - should reject post data with invalid format', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Post Schema Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating Post with invalid format', async (ctx) => {
			const invalidPost = {
				id: 1,
				date: '2023-01-01T00:00:00',
				date_gmt: '2023-01-01T00:00:00',
				guid: { rendered: 'http://example.com/post-1' },
				modified: '2023-01-01T00:00:00',
				modified_gmt: '2023-01-01T00:00:00',
				slug: 'test-post',
				status: 'publish',
				type: 'post',
				title: { rendered: 'Test Post' },
				content: { rendered: 'Post content', protected: false },
				excerpt: { rendered: 'Post excerpt', protected: false },
				author: 1,
				featured_media: 0,
				sticky: false,
				template: '',
				format: 'invalid-format', // invalid format
				meta: [],
				categories: [1, 2],
				tags: [3, 4],
			};

			await ctx.parameter('input', JSON.stringify(invalidPost, null, 2));

			expect(() => {
				Schema.decodeUnknownSync(Post)(invalidPost);
			}).toThrow();
		});
	});

	test('Category - should validate complete category data', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Category Schema Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating Category with complete data', async (ctx) => {
			const validCategory = {
				id: 1,
				count: 5,
				description: 'Test category description',
				link: 'http://example.com/category/test',
				name: 'Test Category',
				slug: 'test-category',
				taxonomy: 'category',
				parent: 0,
				meta: [],
			};

			await ctx.parameter('input', JSON.stringify(validCategory, null, 2));

			const result = Schema.decodeUnknownSync(Category)(validCategory);

			await ctx.parameter('result', JSON.stringify(result, null, 2));

			expect(result).toBeInstanceOf(Category);
			expect(result.id).toBe(1);
			expect(result.name).toBe('Test Category');
			expect(result.parent).toBe(0);
		});
	});

	test('Tag - should validate complete tag data', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Tag Schema Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating Tag with complete data', async (ctx) => {
			const validTag = {
				id: 1,
				count: 3,
				description: 'Test tag description',
				link: 'http://example.com/tag/test',
				name: 'Test Tag',
				slug: 'test-tag',
				taxonomy: 'post_tag',
				meta: [],
			};

			await ctx.parameter('input', JSON.stringify(validTag, null, 2));

			const result = Schema.decodeUnknownSync(Tag)(validTag);

			await ctx.parameter('result', JSON.stringify(result, null, 2));

			expect(result).toBeInstanceOf(Tag);
			expect(result.id).toBe(1);
			expect(result.name).toBe('Test Tag');
			expect(result.taxonomy).toBe('post_tag');
		});
	});

	test('SiteSettings - should validate complete site settings data', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('SiteSettings Schema Tests');
		await allure.tags(...sharedTags);

		await allure.step('Validating SiteSettings with complete data', async (ctx) => {
			const validSettings = {
				name: 'Test Site',
				description: 'A test WordPress site',
				url: 'http://example.com',
				home: 'http://example.com',
				gmt_offset: 0,
				timezone_string: 'UTC',
				site_logo: 1,
				site_icon: 2,
				site_icon_url: 'http://example.com/icon.png',
			};

			await ctx.parameter('input', JSON.stringify(validSettings, null, 2));

			const result = Schema.decodeUnknownSync(SiteSettings)(validSettings);

			await ctx.parameter('result', JSON.stringify(result, null, 2));

			expect(result).toBeInstanceOf(SiteSettings);
			expect(result.name).toBe('Test Site');
			expect(result.description).toBe('A test WordPress site');
			expect(result.url).toBe('http://example.com');
		});
	});
});
