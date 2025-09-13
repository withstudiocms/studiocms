import { describe, expect, it } from '@effect/vitest';
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

describe('WordPress API Schema', () => {
	describe('OpenClosedSchema', () => {
		it('should validate open status', () => {
			const validValues = ['open', 'closed', ''];
			
			validValues.forEach(value => {
				const result = Schema.decodeUnknownSync(OpenClosedSchema)(value);
				expect(result).toBe(value);
			});
		});

		it('should reject invalid status values', () => {
			const invalidValues = ['invalid', 'active', 'inactive', null, undefined];
			
			invalidValues.forEach(value => {
				expect(() => {
					Schema.decodeUnknownSync(OpenClosedSchema)(value);
				}).toThrow();
			});
		});
	});

	describe('StatusSchema', () => {
		it('should validate status values', () => {
			const validStatuses = ['publish', 'future', 'draft', 'pending', 'private'];
			
			validStatuses.forEach(status => {
				const result = Schema.decodeUnknownSync(StatusSchema)(status);
				expect(result).toBe(status);
			});
		});

		it('should reject invalid status values', () => {
			const invalidStatuses = ['invalid', 'active', 'inactive', 'archived', null, undefined];
			
			invalidStatuses.forEach(status => {
				expect(() => {
					Schema.decodeUnknownSync(StatusSchema)(status);
				}).toThrow();
			});
		});
	});

	describe('PostFormatSchema', () => {
		it('should validate post format values', () => {
			const validFormats = ['standard', 'aside', 'chat', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio', ''];
			
			validFormats.forEach(format => {
				const result = Schema.decodeUnknownSync(PostFormatSchema)(format);
				expect(result).toBe(format);
			});
		});

		it('should reject invalid post format values', () => {
			const invalidFormats = ['invalid', 'custom', 'blog', null, undefined];
			
			invalidFormats.forEach(format => {
				expect(() => {
					Schema.decodeUnknownSync(PostFormatSchema)(format);
				}).toThrow();
			});
		});
	});

	describe('MetaDataSchema', () => {
		it('should validate array of metadata', () => {
			const validMetadata = [
				{ key: 'test', value: 'value' },
				{ key: 'number', value: 123 },
				{ key: 'boolean', value: true },
			];
			
			const result = Schema.decodeUnknownSync(MetaDataSchema)(validMetadata);
			expect(result).toEqual(validMetadata);
		});

		it('should validate empty metadata array', () => {
			const result = Schema.decodeUnknownSync(MetaDataSchema)([]);
			expect(result).toEqual([]);
		});

		it('should reject invalid metadata structure', () => {
			const invalidMetadata = [
				{ invalid: 'structure' },
				'not an object',
				{ key: 'missing value' },
			];
			
			invalidMetadata.forEach(metadata => {
				expect(() => {
					Schema.decodeUnknownSync(MetaDataSchema)(metadata);
				}).toThrow();
			});
		});
	});

	describe('RenderedData', () => {
		it('should validate rendered data structure', () => {
			const validData = { rendered: 'Some HTML content' };
			
			const result = Schema.decodeUnknownSync(RenderedData)(validData);
			expect(result).toEqual(validData);
		});

		it('should reject data without rendered field', () => {
			const invalidData = { content: 'Some content' };
			
			expect(() => {
				Schema.decodeUnknownSync(RenderedData)(invalidData);
			}).toThrow();
		});
	});

	describe('RenderedProtectData', () => {
		it('should validate rendered protected data structure', () => {
			const validData = { 
				rendered: 'Some HTML content',
				protected: true 
			};
			
			const result = Schema.decodeUnknownSync(RenderedProtectData)(validData);
			expect(result).toEqual(validData);
		});

		it('should reject data without required fields', () => {
			const invalidData = { rendered: 'Some content' }; // missing protected field
			
			expect(() => {
				Schema.decodeUnknownSync(RenderedProtectData)(invalidData);
			}).toThrow();
		});
	});

	describe('NumberArray', () => {
		it('should validate array of numbers', () => {
			const validNumbers = [1, 2, 3, 4, 5];
			
			const result = Schema.decodeUnknownSync(NumberArray)(validNumbers);
			expect(result).toEqual(validNumbers);
		});

		it('should validate empty number array', () => {
			const result = Schema.decodeUnknownSync(NumberArray)([]);
			expect(result).toEqual([]);
		});

		it('should reject array with non-numbers', () => {
			const invalidNumbers = [1, '2', 3, true, 5];
			
			expect(() => {
				Schema.decodeUnknownSync(NumberArray)(invalidNumbers);
			}).toThrow();
		});
	});

	describe('Page', () => {
		it('should validate complete page data', () => {
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
			
			const result = Schema.decodeUnknownSync(Page)(validPage);
			// Check that the result is a Page instance with correct data
			expect(result).toBeInstanceOf(Page);
			expect(result.id).toBe(1);
			expect(result.slug).toBe('test-page');
			expect(result.status).toBe('publish');
		});

		it('should reject page data with missing required fields', () => {
			const invalidPage = {
				id: 1,
				// missing required fields
			};
			
			expect(() => {
				Schema.decodeUnknownSync(Page)(invalidPage);
			}).toThrow();
		});
	});

	describe('Post', () => {
		it('should validate complete post data', () => {
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
			
			const result = Schema.decodeUnknownSync(Post)(validPost);
			expect(result).toBeInstanceOf(Post);
			expect(result.id).toBe(1);
			expect(result.slug).toBe('test-post');
			expect(result.format).toBe('standard');
		});

		it('should reject post data with invalid format', () => {
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
			
			expect(() => {
				Schema.decodeUnknownSync(Post)(invalidPost);
			}).toThrow();
		});
	});

	describe('Category', () => {
		it('should validate complete category data', () => {
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
			
			const result = Schema.decodeUnknownSync(Category)(validCategory);
			expect(result).toBeInstanceOf(Category);
			expect(result.id).toBe(1);
			expect(result.name).toBe('Test Category');
			expect(result.parent).toBe(0);
		});
	});

	describe('Tag', () => {
		it('should validate complete tag data', () => {
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
			
			const result = Schema.decodeUnknownSync(Tag)(validTag);
			expect(result).toBeInstanceOf(Tag);
			expect(result.id).toBe(1);
			expect(result.name).toBe('Test Tag');
			expect(result.taxonomy).toBe('post_tag');
		});
	});

	describe('SiteSettings', () => {
		it('should validate complete settings data', () => {
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
			
			const result = Schema.decodeUnknownSync(SiteSettings)(validSettings);
			expect(result).toBeInstanceOf(SiteSettings);
			expect(result.name).toBe('Test Site');
			expect(result.description).toBe('A test WordPress site');
			expect(result.url).toBe('http://example.com');
		});
	});
});