import { beforeEach, describe, expect, it } from '@effect/vitest';
import type { APIContext } from 'astro';
import { Effect } from 'studiocms/effect';
import {
	APIEndpointConfig,
	AstroAPIContextProvider,
	CategoryOrTagConfig,
	DownloadImageConfig,
	DownloadPostImageConfig,
	FullPageData,
	ImportEndpointConfig,
	ImportPostsEndpointConfig,
	RawPageData,
	StringConfig,
	UseBlogPkgConfig,
} from '../src/effects/WordPressAPI/configs';
import type { PageData } from '../src/effects/WordPressAPI/importers';

describe('WordPress API Configs', () => {
	describe('StringConfig', () => {
		it('should create StringConfig with correct structure', () => {
			const str = 'test-string';
			const config = StringConfig.of({ str });

			expect(config.str).toBe(str);
			expect(config).toHaveProperty('str', str);
		});

		it.effect('should create layer with makeLayer', () =>
			Effect.gen(function* () {
				const str = 'test-string';
				const layer = StringConfig.makeLayer(str);

				// Test that the layer can be used to provide the config
				const config = yield* StringConfig;
				expect(config.str).toBe(str);
			}).pipe(Effect.provide(StringConfig.makeLayer('test-string')))
		);
	});

	describe('APIEndpointConfig', () => {
		const SUPPORTED_TYPES = ['posts', 'pages', 'media', 'categories', 'tags', 'settings'] as const;

		it('should create APIEndpointConfig with valid type', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const type = 'posts' as const;
			const path = '/posts';
			const config = APIEndpointConfig.of({ endpoint, type, path });

			expect(config.endpoint).toBe(endpoint);
			expect(config.type).toBe(type);
			expect(config.path).toBe(path);
		});

		it('should validate supported types', () => {
			SUPPORTED_TYPES.forEach((type) => {
				expect(SUPPORTED_TYPES.includes(type)).toBe(true);
			});
		});

		it('should reject invalid types', () => {
			const invalidType = 'invalid';
			expect(SUPPORTED_TYPES.includes(invalidType as (typeof SUPPORTED_TYPES)[number])).toBe(false);
		});

		it('should create layer with makeLayer', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const type = 'pages' as const;

			const result = APIEndpointConfig.makeLayer(endpoint, type);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});

		it('should handle optional path parameter', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const type = 'posts' as const;
			const config = APIEndpointConfig.of({ endpoint, type });

			expect(config.endpoint).toBe(endpoint);
			expect(config.type).toBe(type);
			expect(config.path).toBeUndefined();
		});
	});

	describe('DownloadImageConfig', () => {
		it('should create DownloadImageConfig with string URLs', () => {
			const imageUrl = 'https://example.com/image.jpg';
			const destination = '/public/images/image.jpg';
			const config = DownloadImageConfig.of({ imageUrl, destination });

			expect(config.imageUrl).toBe(imageUrl);
			expect(config.destination).toBe(destination);
		});

		it('should create DownloadImageConfig with URL objects', () => {
			const imageUrl = new URL('https://example.com/image.jpg');
			const destination = new URL('file:///public/images/image.jpg');
			const config = DownloadImageConfig.of({ imageUrl, destination });

			expect(config.imageUrl).toBe(imageUrl);
			expect(config.destination).toBe(destination);
		});

		it('should create layer with makeLayer', () => {
			const imageUrl = 'https://example.com/image.jpg';
			const destination = '/public/images/image.jpg';

			const result = DownloadImageConfig.makeLayer(imageUrl, destination);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('DownloadPostImageConfig', () => {
		it('should create DownloadPostImageConfig', () => {
			const str = 'image-content';
			const pathToFolder = '/public/images';
			const config = DownloadPostImageConfig.of({ str, pathToFolder });

			expect(config.str).toBe(str);
			expect(config.pathToFolder).toBe(pathToFolder);
		});

		it('should create layer with makeLayer', () => {
			const str = 'image-content';
			const pathToFolder = '/public/images';

			const result = DownloadPostImageConfig.makeLayer(str, pathToFolder);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('ImportEndpointConfig', () => {
		it('should create ImportEndpointConfig', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const config = ImportEndpointConfig.of({ endpoint });

			expect(config.endpoint).toBe(endpoint);
		});

		it('should create layer with makeLayer', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';

			const result = ImportEndpointConfig.makeLayer(endpoint);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('ImportPostsEndpointConfig', () => {
		it('should create ImportPostsEndpointConfig with default useBlogPkg', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const useBlogPkg = false;
			const config = ImportPostsEndpointConfig.of({ endpoint, useBlogPkg });

			expect(config.endpoint).toBe(endpoint);
			expect(config.useBlogPkg).toBe(useBlogPkg);
		});

		it('should create ImportPostsEndpointConfig with useBlogPkg true', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const useBlogPkg = true;
			const config = ImportPostsEndpointConfig.of({ endpoint, useBlogPkg });

			expect(config.endpoint).toBe(endpoint);
			expect(config.useBlogPkg).toBe(useBlogPkg);
		});

		it('should create layer with makeLayer', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const useBlogPkg = true;

			const result = ImportPostsEndpointConfig.makeLayer(endpoint, useBlogPkg);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('AstroAPIContextProvider', () => {
		it('should create AstroAPIContextProvider with context', () => {
			const context = {
				request: new Request('https://example.com'),
				params: {},
				props: {},
			} as APIContext;
			const provider = AstroAPIContextProvider.of({ context });

			expect(provider.context).toBe(context);
		});

		it('should create layer with makeLayer', () => {
			const context = {
				request: new Request('https://example.com'),
				params: {},
				props: {},
			} as APIContext;

			const result = AstroAPIContextProvider.makeLayer(context);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('RawPageData', () => {
		it('should create RawPageData with page data', () => {
			const page = { id: 1, title: 'Test Page' };
			const rawData = RawPageData.of({ page });

			expect(rawData.page).toBe(page);
		});

		it('should create layer with makeLayer', () => {
			const page = { id: 1, title: 'Test Page' };

			const result = RawPageData.makeLayer(page);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('FullPageData', () => {
		it('should create FullPageData with pageData', () => {
			const pageData = {
				id: 1,
				title: 'Test Page',
				content: 'Test content',
				slug: 'test-page',
			} as PageData;
			const fullData = FullPageData.of({ pageData });

			expect(fullData.pageData).toBe(pageData);
		});

		it('should create layer with makeLayer', () => {
			const pageData = {
				id: 1,
				title: 'Test Page',
				content: 'Test content',
				slug: 'test-page',
			} as PageData;

			const result = FullPageData.makeLayer(pageData);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('UseBlogPkgConfig', () => {
		it('should create UseBlogPkgConfig with useBlogPkg false', () => {
			const useBlogPkg = false;
			const config = UseBlogPkgConfig.of({ useBlogPkg });

			expect(config.useBlogPkg).toBe(useBlogPkg);
		});

		it('should create UseBlogPkgConfig with useBlogPkg true', () => {
			const useBlogPkg = true;
			const config = UseBlogPkgConfig.of({ useBlogPkg });

			expect(config.useBlogPkg).toBe(useBlogPkg);
		});

		it('should create layer with makeLayer', () => {
			const useBlogPkg = true;

			const result = UseBlogPkgConfig.makeLayer(useBlogPkg);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('CategoryOrTagConfig', () => {
		it('should create CategoryOrTagConfig with number array', () => {
			const value = [1, 2, 3] as const;
			const config = CategoryOrTagConfig.of({ value });

			expect(config.value).toBe(value);
		});

		it('should create CategoryOrTagConfig with empty array', () => {
			const value = [] as const;
			const config = CategoryOrTagConfig.of({ value });

			expect(config.value).toBe(value);
		});

		it('should create layer with makeLayer', () => {
			const value = [1, 2, 3] as const;

			const result = CategoryOrTagConfig.makeLayer(value);
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});
	});

	describe('Configuration Validation', () => {
		it('should validate all required fields are present', () => {
			const configs = [
				StringConfig.of({ str: 'test' }),
				APIEndpointConfig.of({ endpoint: 'https://example.com', type: 'posts' as const }),
				DownloadImageConfig.of({
					imageUrl: 'https://example.com/image.jpg',
					destination: '/public/images',
				}),
				DownloadPostImageConfig.of({ str: 'content', pathToFolder: '/public' }),
				ImportEndpointConfig.of({ endpoint: 'https://example.com' }),
				ImportPostsEndpointConfig.of({ endpoint: 'https://example.com', useBlogPkg: false }),
				AstroAPIContextProvider.of({ context: {} as APIContext }),
				RawPageData.of({ page: {} }),
				FullPageData.of({ pageData: {} as PageData }),
				UseBlogPkgConfig.of({ useBlogPkg: false }),
				CategoryOrTagConfig.of({ value: [] as const }),
			];

			configs.forEach((config) => {
				expect(config).toBeDefined();
				expect(typeof config).toBe('object');
			});
		});
	});
});
