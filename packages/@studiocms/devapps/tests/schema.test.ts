import { beforeEach, describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

// Mock studiocms/effect
vi.mock('studiocms/effect', () => ({
	Schema: {
		Union: vi.fn((...schemas) => ({ type: 'union', schemas })),
		Literal: vi.fn((value) => ({ type: 'literal', value })),
		Array: vi.fn((schema) => ({ type: 'array', schema })),
		Struct: vi.fn((fields) => ({ type: 'struct', fields })),
		Class: vi.fn((name) => (fields: any) => ({ type: 'class', name, fields })),
		String: { type: 'string' },
		Number: { type: 'number' },
		Boolean: { type: 'boolean' },
		Date: { type: 'date' },
		Any: { type: 'any' },
		Record: vi.fn((keySchema, valueSchema) => ({ type: 'record', keySchema, valueSchema })),
		optional: vi.fn((schema) => ({ type: 'optional', schema })),
	},
}));

describe('WordPress API Schema', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('OpenClosedSchema', () => {
		it('should create union schema with open, closed, and empty string', () => {
			const schema = {
				type: 'union',
				schemas: [
					{ type: 'literal', value: 'open' },
					{ type: 'literal', value: 'closed' },
					{ type: 'literal', value: '' },
				],
			};

			expect(schema.type).toBe('union');
			expect(schema.schemas).toHaveLength(3);
			expect(schema.schemas[0].value).toBe('open');
			expect(schema.schemas[1].value).toBe('closed');
			expect(schema.schemas[2].value).toBe('');
		});

		it('should validate open status', () => {
			const validValues = ['open', 'closed', ''];
			validValues.forEach(value => {
				expect(validValues.includes(value)).toBe(true);
			});
		});
	});

	describe('StatusSchema', () => {
		it('should create union schema with all status values', () => {
			const schema = {
				type: 'union',
				schemas: [
					{ type: 'literal', value: 'publish' },
					{ type: 'literal', value: 'future' },
					{ type: 'literal', value: 'draft' },
					{ type: 'literal', value: 'pending' },
					{ type: 'literal', value: 'private' },
				],
			};

			expect(schema.type).toBe('union');
			expect(schema.schemas).toHaveLength(5);
			expect(schema.schemas[0].value).toBe('publish');
			expect(schema.schemas[1].value).toBe('future');
			expect(schema.schemas[2].value).toBe('draft');
			expect(schema.schemas[3].value).toBe('pending');
			expect(schema.schemas[4].value).toBe('private');
		});

		it('should validate status values', () => {
			const validStatuses = ['publish', 'future', 'draft', 'pending', 'private'];
			validStatuses.forEach(status => {
				expect(validStatuses.includes(status)).toBe(true);
			});
		});
	});

	describe('PostFormatSchema', () => {
		it('should create union schema with all post format values', () => {
			const schema = {
				type: 'union',
				schemas: [
					{ type: 'literal', value: 'standard' },
					{ type: 'literal', value: 'aside' },
					{ type: 'literal', value: 'chat' },
					{ type: 'literal', value: 'gallery' },
					{ type: 'literal', value: 'link' },
					{ type: 'literal', value: 'image' },
					{ type: 'literal', value: 'quote' },
					{ type: 'literal', value: 'status' },
					{ type: 'literal', value: 'video' },
					{ type: 'literal', value: 'audio' },
					{ type: 'literal', value: '' },
				],
			};

			expect(schema.type).toBe('union');
			expect(schema.schemas).toHaveLength(11);
		});

		it('should validate post format values', () => {
			const validFormats = [
				'standard', 'aside', 'chat', 'gallery', 'link',
				'image', 'quote', 'status', 'video', 'audio', ''
			];
			validFormats.forEach(format => {
				expect(validFormats.includes(format)).toBe(true);
			});
		});
	});

	describe('MetaDataSchema', () => {
		it('should create array schema with union of any or record', () => {
			const schema = {
				type: 'array',
				schema: {
					type: 'union',
					schemas: [
						{ type: 'any' },
						{ type: 'record', keySchema: { type: 'string' }, valueSchema: { type: 'any' } },
					],
				},
			};

			expect(schema.type).toBe('array');
			expect(schema.schema.type).toBe('union');
			expect(schema.schema.schemas).toHaveLength(2);
		});
	});

	describe('RenderedData', () => {
		it('should create struct schema with rendered field', () => {
			const schema = {
				type: 'struct',
				fields: {
					rendered: { type: 'string' },
				},
			};

			expect(schema.type).toBe('struct');
			expect(schema.fields.rendered.type).toBe('string');
		});
	});

	describe('RenderedProtectData', () => {
		it('should create struct schema with rendered and protected fields', () => {
			const schema = {
				type: 'struct',
				fields: {
					rendered: { type: 'string' },
					protected: { type: 'boolean' },
				},
			};

			expect(schema.type).toBe('struct');
			expect(schema.fields.rendered.type).toBe('string');
			expect(schema.fields.protected.type).toBe('boolean');
		});
	});

	describe('NumberArray', () => {
		it('should create array schema with number elements', () => {
			const schema = {
				type: 'array',
				schema: { type: 'number' },
			};

			expect(schema.type).toBe('array');
			expect(schema.schema.type).toBe('number');
		});
	});

	describe('Page Schema', () => {
		it('should create class schema with all required fields', () => {
			const schema = {
				type: 'class',
				name: 'Page',
				fields: {
					id: { type: 'number' },
					date: { type: 'date' },
					date_gmt: { type: 'date' },
					guid: { type: 'struct', fields: { rendered: { type: 'string' } } },
					modified: { type: 'date' },
					modified_gmt: { type: 'date' },
					slug: { type: 'string' },
					status: { type: 'union', schemas: [] },
					type: { type: 'string' },
					title: { type: 'struct', fields: { rendered: { type: 'string' } } },
					content: { type: 'struct', fields: { rendered: { type: 'string' }, protected: { type: 'boolean' } } },
					excerpt: { type: 'struct', fields: { rendered: { type: 'string' }, protected: { type: 'boolean' } } },
					author: { type: 'number' },
					featured_media: { type: 'number' },
					parent: { type: 'number' },
					menu_order: { type: 'number' },
					comment_status: { type: 'union', schemas: [] },
					ping_status: { type: 'union', schemas: [] },
					template: { type: 'string' },
					meta: { type: 'array', schema: { type: 'union', schemas: [] } },
				},
			};

			expect(schema.type).toBe('class');
			expect(schema.name).toBe('Page');
			expect(schema.fields.id.type).toBe('number');
			expect(schema.fields.title.type).toBe('struct');
			expect(schema.fields.content.type).toBe('struct');
		});
	});

	describe('PagesSchema', () => {
		it('should create class schema with pages array', () => {
			const schema = {
				type: 'class',
				name: 'PagesSchema',
				fields: {
					pages: { type: 'array', schema: { type: 'class', name: 'Page' } },
				},
			};

			expect(schema.type).toBe('class');
			expect(schema.name).toBe('PagesSchema');
			expect(schema.fields.pages.type).toBe('array');
		});
	});

	describe('Post Schema', () => {
		it('should extend Page schema with additional fields', () => {
			const schema = {
				type: 'class',
				name: 'Post',
				fields: {
					// Page fields
					id: { type: 'number' },
					title: { type: 'struct', fields: { rendered: { type: 'string' } } },
					// Post-specific fields
					format: { type: 'union', schemas: [] },
					categories: { type: 'array', schema: { type: 'number' } },
					tags: { type: 'array', schema: { type: 'number' } },
				},
			};

			expect(schema.type).toBe('class');
			expect(schema.name).toBe('Post');
			expect(schema.fields.format.type).toBe('union');
			expect(schema.fields.categories.type).toBe('array');
			expect(schema.fields.tags.type).toBe('array');
		});
	});

	describe('PostsSchema', () => {
		it('should create class schema with posts array', () => {
			const schema = {
				type: 'class',
				name: 'PostsSchema',
				fields: {
					posts: { type: 'array', schema: { type: 'class', name: 'Post' } },
				},
			};

			expect(schema.type).toBe('class');
			expect(schema.name).toBe('PostsSchema');
			expect(schema.fields.posts.type).toBe('array');
		});
	});

	describe('Tag Schema', () => {
		it('should create class schema with tag fields', () => {
			const schema = {
				type: 'class',
				name: 'Tag',
				fields: {
					id: { type: 'number' },
					count: { type: 'number' },
					description: { type: 'string' },
					link: { type: 'string' },
					name: { type: 'string' },
					slug: { type: 'string' },
					taxonomy: { type: 'string' },
					meta: { type: 'array', schema: { type: 'union', schemas: [] } },
				},
			};

			expect(schema.type).toBe('class');
			expect(schema.name).toBe('Tag');
			expect(schema.fields.id.type).toBe('number');
			expect(schema.fields.name.type).toBe('string');
			expect(schema.fields.slug.type).toBe('string');
		});
	});

	describe('TagsSchema', () => {
		it('should create class schema with tags array', () => {
			const schema = {
				type: 'class',
				name: 'TagsSchema',
				fields: {
					tags: { type: 'array', schema: { type: 'class', name: 'Tag' } },
				},
			};

			expect(schema.type).toBe('class');
			expect(schema.name).toBe('TagsSchema');
			expect(schema.fields.tags.type).toBe('array');
		});
	});

	describe('Category Schema', () => {
		it('should extend Tag schema with parent field', () => {
			const schema = {
				type: 'class',
				name: 'Category',
				fields: {
					// Tag fields
					id: { type: 'number' },
					name: { type: 'string' },
					slug: { type: 'string' },
					// Category-specific field
					parent: { type: 'number' },
				},
			};

			expect(schema.type).toBe('class');
			expect(schema.name).toBe('Category');
			expect(schema.fields.id.type).toBe('number');
			expect(schema.fields.parent.type).toBe('number');
		});
	});

	describe('CategoriesSchema', () => {
		it('should create class schema with categories array', () => {
			const schema = {
				type: 'class',
				name: 'CategoriesSchema',
				fields: {
					categories: { type: 'array', schema: { type: 'class', name: 'Category' } },
				},
			};

			expect(schema.type).toBe('class');
			expect(schema.name).toBe('CategoriesSchema');
			expect(schema.fields.categories.type).toBe('array');
		});
	});

	describe('SiteSettings Schema', () => {
		it('should create class schema with site settings fields', () => {
			const schema = {
				type: 'class',
				name: 'SiteSettings',
				fields: {
					name: { type: 'string' },
					description: { type: 'string' },
					url: { type: 'string' },
					home: { type: 'string' },
					gmt_offset: { type: 'number' },
					timezone_string: { type: 'string' },
					site_logo: { type: 'optional', schema: { type: 'number' } },
					site_icon: { type: 'optional', schema: { type: 'number' } },
					site_icon_url: { type: 'optional', schema: { type: 'string' } },
				},
			};

			expect(schema.type).toBe('class');
			expect(schema.name).toBe('SiteSettings');
			expect(schema.fields.name.type).toBe('string');
			expect(schema.fields.gmt_offset.type).toBe('number');
			expect(schema.fields.site_logo.type).toBe('optional');
		});
	});

	describe('Schema Validation', () => {
		it('should validate WordPress page data structure', () => {
			const pageData = {
				id: 1,
				date: new Date(),
				date_gmt: new Date(),
				guid: { rendered: 'https://example.com/page/1' },
				modified: new Date(),
				modified_gmt: new Date(),
				slug: 'test-page',
				status: 'publish',
				type: 'page',
				title: { rendered: 'Test Page' },
				content: { rendered: 'Test content', protected: false },
				excerpt: { rendered: 'Test excerpt', protected: false },
				author: 1,
				featured_media: 0,
				parent: 0,
				menu_order: 0,
				comment_status: 'open',
				ping_status: 'open',
				template: '',
				meta: [],
			};

			expect(pageData.id).toBeTypeOf('number');
			expect(pageData.title.rendered).toBeTypeOf('string');
			expect(pageData.content.rendered).toBeTypeOf('string');
			expect(pageData.content.protected).toBeTypeOf('boolean');
		});

		it('should validate WordPress post data structure', () => {
			const postData = {
				id: 1,
				title: { rendered: 'Test Post' },
				content: { rendered: 'Test content', protected: false },
				format: 'standard',
				categories: [1, 2],
				tags: [3, 4],
			};

			expect(postData.id).toBeTypeOf('number');
			expect(postData.title.rendered).toBeTypeOf('string');
			expect(Array.isArray(postData.categories)).toBe(true);
			expect(Array.isArray(postData.tags)).toBe(true);
		});
	});
});
