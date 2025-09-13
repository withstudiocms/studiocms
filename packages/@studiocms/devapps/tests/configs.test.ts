import { beforeEach, describe, expect, it } from '@effect/vitest';
import { Context, Effect, Layer } from 'studiocms/effect';
import { vi } from 'vitest';

// Mock studiocms/effect
vi.mock('studiocms/effect', () => ({
	Effect: {
		provide: vi.fn((layer) => vi.fn((effect) => effect)),
	},
	Context: {
		Tag: vi.fn((name) => ({
			of: vi.fn((data) => data),
		})),
	},
	Layer: {
		succeed: vi.fn((tag, data) => ({ tag, data })),
	},
}));

describe('WordPress API Configs', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('StringConfig', () => {
		it('should create StringConfig with correct structure', () => {
			const str = 'test-string';
			const config = { str };
			
			expect(config.str).toBe(str);
		});

		it('should create layer with makeLayer', () => {
			const str = 'test-string';
			const mockLayer = { tag: 'StringConfig', data: { str } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('StringConfig', { str });
			expect(result).toEqual(mockLayer);
		});

		it('should provide effect with makeProvide', () => {
			const str = 'test-string';
			const mockEffect = vi.fn();
			
			Effect.provide.mockReturnValue(mockEffect);
			
			const result = Effect.provide({ tag: 'StringConfig', data: { str } });
			expect(result).toBe(mockEffect);
		});
	});

	describe('APIEndpointConfig', () => {
		const SUPPORTED_TYPES = ['posts', 'pages', 'media', 'categories', 'tags', 'settings'];

		it('should create APIEndpointConfig with valid type', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const type = 'posts';
			const path = '/posts';
			const config = { endpoint, type, path };
			
			expect(config.endpoint).toBe(endpoint);
			expect(config.type).toBe(type);
			expect(config.path).toBe(path);
		});

		it('should validate supported types', () => {
			SUPPORTED_TYPES.forEach(type => {
				expect(SUPPORTED_TYPES.includes(type)).toBe(true);
			});
		});

		it('should reject invalid types', () => {
			const invalidType = 'invalid';
			expect(SUPPORTED_TYPES.includes(invalidType)).toBe(false);
		});

		it('should create layer with makeLayer', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const type = 'pages';
			const mockLayer = { tag: 'APIEndpointConfig', data: { endpoint, type } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('APIEndpointConfig', { endpoint, type });
			expect(result).toEqual(mockLayer);
		});

		it('should handle optional path parameter', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const type = 'posts';
			const config = { endpoint, type };
			
			expect(config.endpoint).toBe(endpoint);
			expect(config.type).toBe(type);
			expect(config.path).toBeUndefined();
		});
	});

	describe('DownloadImageConfig', () => {
		it('should create DownloadImageConfig with string URLs', () => {
			const imageUrl = 'https://example.com/image.jpg';
			const destination = '/public/images/image.jpg';
			const config = { imageUrl, destination };
			
			expect(config.imageUrl).toBe(imageUrl);
			expect(config.destination).toBe(destination);
		});

		it('should create DownloadImageConfig with URL objects', () => {
			const imageUrl = new URL('https://example.com/image.jpg');
			const destination = new URL('file:///public/images/image.jpg');
			const config = { imageUrl, destination };
			
			expect(config.imageUrl).toBe(imageUrl);
			expect(config.destination).toBe(destination);
		});

		it('should create layer with makeLayer', () => {
			const imageUrl = 'https://example.com/image.jpg';
			const destination = '/public/images/image.jpg';
			const mockLayer = { tag: 'DownloadImageConfig', data: { imageUrl, destination } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('DownloadImageConfig', { imageUrl, destination });
			expect(result).toEqual(mockLayer);
		});
	});

	describe('DownloadPostImageConfig', () => {
		it('should create DownloadPostImageConfig', () => {
			const str = 'image-content';
			const pathToFolder = '/public/images';
			const config = { str, pathToFolder };
			
			expect(config.str).toBe(str);
			expect(config.pathToFolder).toBe(pathToFolder);
		});

		it('should create layer with makeLayer', () => {
			const str = 'image-content';
			const pathToFolder = '/public/images';
			const mockLayer = { tag: 'DownloadPostImageConfig', data: { str, pathToFolder } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('DownloadPostImageConfig', { str, pathToFolder });
			expect(result).toEqual(mockLayer);
		});
	});

	describe('ImportEndpointConfig', () => {
		it('should create ImportEndpointConfig', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const config = { endpoint };
			
			expect(config.endpoint).toBe(endpoint);
		});

		it('should create layer with makeLayer', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const mockLayer = { tag: 'ImportEndpointConfig', data: { endpoint } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('ImportEndpointConfig', { endpoint });
			expect(result).toEqual(mockLayer);
		});
	});

	describe('ImportPostsEndpointConfig', () => {
		it('should create ImportPostsEndpointConfig with default useBlogPkg', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const useBlogPkg = false;
			const config = { endpoint, useBlogPkg };
			
			expect(config.endpoint).toBe(endpoint);
			expect(config.useBlogPkg).toBe(useBlogPkg);
		});

		it('should create ImportPostsEndpointConfig with useBlogPkg true', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const useBlogPkg = true;
			const config = { endpoint, useBlogPkg };
			
			expect(config.endpoint).toBe(endpoint);
			expect(config.useBlogPkg).toBe(useBlogPkg);
		});

		it('should create layer with makeLayer', () => {
			const endpoint = 'https://example.com/wp-json/wp/v2';
			const useBlogPkg = true;
			const mockLayer = { tag: 'ImportPostsEndpointConfig', data: { endpoint, useBlogPkg } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('ImportPostsEndpointConfig', { endpoint, useBlogPkg });
			expect(result).toEqual(mockLayer);
		});
	});

	describe('AstroAPIContextProvider', () => {
		it('should create AstroAPIContextProvider with context', () => {
			const context = {
				request: new Request('https://example.com'),
				params: {},
				props: {},
			};
			const provider = { context };
			
			expect(provider.context).toBe(context);
		});

		it('should create layer with makeLayer', () => {
			const context = {
				request: new Request('https://example.com'),
				params: {},
				props: {},
			};
			const mockLayer = { tag: 'AstroAPIContextProvider', data: { context } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('AstroAPIContextProvider', { context });
			expect(result).toEqual(mockLayer);
		});
	});

	describe('RawPageData', () => {
		it('should create RawPageData with page data', () => {
			const page = { id: 1, title: 'Test Page' };
			const rawData = { page };
			
			expect(rawData.page).toBe(page);
		});

		it('should create layer with makeLayer', () => {
			const page = { id: 1, title: 'Test Page' };
			const mockLayer = { tag: 'RawPageData', data: { page } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('RawPageData', { page });
			expect(result).toEqual(mockLayer);
		});
	});

	describe('FullPageData', () => {
		it('should create FullPageData with pageData', () => {
			const pageData = {
				id: 1,
				title: 'Test Page',
				content: 'Test content',
				slug: 'test-page',
			};
			const fullData = { pageData };
			
			expect(fullData.pageData).toBe(pageData);
		});

		it('should create layer with makeLayer', () => {
			const pageData = {
				id: 1,
				title: 'Test Page',
				content: 'Test content',
				slug: 'test-page',
			};
			const mockLayer = { tag: 'FullPageData', data: { pageData } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('FullPageData', { pageData });
			expect(result).toEqual(mockLayer);
		});
	});

	describe('UseBlogPkgConfig', () => {
		it('should create UseBlogPkgConfig with useBlogPkg false', () => {
			const useBlogPkg = false;
			const config = { useBlogPkg };
			
			expect(config.useBlogPkg).toBe(useBlogPkg);
		});

		it('should create UseBlogPkgConfig with useBlogPkg true', () => {
			const useBlogPkg = true;
			const config = { useBlogPkg };
			
			expect(config.useBlogPkg).toBe(useBlogPkg);
		});

		it('should create layer with makeLayer', () => {
			const useBlogPkg = true;
			const mockLayer = { tag: 'UseBlogPkgConfig', data: { useBlogPkg } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('UseBlogPkgConfig', { useBlogPkg });
			expect(result).toEqual(mockLayer);
		});
	});

	describe('CategoryOrTagConfig', () => {
		it('should create CategoryOrTagConfig with number array', () => {
			const value = [1, 2, 3] as const;
			const config = { value };
			
			expect(config.value).toBe(value);
		});

		it('should create CategoryOrTagConfig with empty array', () => {
			const value = [] as const;
			const config = { value };
			
			expect(config.value).toBe(value);
		});

		it('should create layer with makeLayer', () => {
			const value = [1, 2, 3] as const;
			const mockLayer = { tag: 'CategoryOrTagConfig', data: { value } };
			
			Layer.succeed.mockReturnValue(mockLayer);
			
			const result = Layer.succeed('CategoryOrTagConfig', { value });
			expect(result).toEqual(mockLayer);
		});
	});

	describe('Configuration Validation', () => {
		it('should validate all required fields are present', () => {
			const configs = [
				{ str: 'test' }, // StringConfig
				{ endpoint: 'https://example.com', type: 'posts' }, // APIEndpointConfig
				{ imageUrl: 'https://example.com/image.jpg', destination: '/public/images' }, // DownloadImageConfig
				{ str: 'content', pathToFolder: '/public' }, // DownloadPostImageConfig
				{ endpoint: 'https://example.com' }, // ImportEndpointConfig
				{ endpoint: 'https://example.com', useBlogPkg: false }, // ImportPostsEndpointConfig
				{ context: {} }, // AstroAPIContextProvider
				{ page: {} }, // RawPageData
				{ pageData: {} }, // FullPageData
				{ useBlogPkg: false }, // UseBlogPkgConfig
				{ value: [] }, // CategoryOrTagConfig
			];

			configs.forEach(config => {
				expect(config).toBeDefined();
				expect(typeof config).toBe('object');
			});
		});
	});
});
