import { describe, expect, it } from 'vitest';
import { FrontEndConfigSchema, faviconTypeMap, isFaviconExt } from '../src/types';

describe('FrontEndConfigSchema', () => {
	it('should use defaults when no config is provided', () => {
		const parsed = FrontEndConfigSchema.parse({});
		expect(parsed.htmlDefaultLanguage).toBe('en');
		expect(parsed.favicon).toBe('/favicon.svg');
		expect(parsed.sitemap).toBe(true);
		expect(parsed.injectRoutes).toBe(true);
		expect(parsed.blog.title).toBe('Blog');
		expect(parsed.blog.enableRSS).toBe(true);
		expect(parsed.blog.route).toBe('/blog');
	});

	it('should accept valid favicon extensions', () => {
		const validFavicons = [
			'/favicon.ico',
			'/favicon.gif',
			'/favicon.jpg',
			'/favicon.jpeg',
			'/favicon.png',
			'/favicon.svg',
		];
		for (const fav of validFavicons) {
			expect(() => FrontEndConfigSchema.parse({ favicon: fav })).not.toThrow();
		}
	});

	it('should reject invalid favicon extensions', () => {
		expect(() => FrontEndConfigSchema.parse({ favicon: '/favicon.bmp' })).toThrow(
			/favicon must be a .ico, .gif, .jpg, .png, or .svg file/
		);
	});

	it('should allow custom blog config', () => {
		const parsed = FrontEndConfigSchema.parse({
			blog: {
				title: 'News',
				enableRSS: false,
				route: '/news',
			},
		});
		expect(parsed.blog.title).toBe('News');
		expect(parsed.blog.enableRSS).toBe(false);
		expect(parsed.blog.route).toBe('/news');
	});

	it('should allow partial blog config and fill defaults', () => {
		const parsed = FrontEndConfigSchema.parse({
			blog: {
				title: 'Updates',
			},
		});
		expect(parsed.blog.title).toBe('Updates');
		expect(parsed.blog.enableRSS).toBe(true);
		expect(parsed.blog.route).toBe('/blog');
	});

	it('should allow overriding top-level options', () => {
		const parsed = FrontEndConfigSchema.parse({
			htmlDefaultLanguage: 'fr',
			sitemap: false,
			injectRoutes: false,
		});
		expect(parsed.htmlDefaultLanguage).toBe('fr');
		expect(parsed.sitemap).toBe(false);
		expect(parsed.injectRoutes).toBe(false);
	});

	it('isFaviconExt should return true for valid extensions', () => {
		const validExts = Object.keys(faviconTypeMap) as Array<keyof typeof faviconTypeMap>;
		for (const ext of validExts) {
			expect(isFaviconExt(ext)).toBe(true);
		}
	});

	it('isFaviconExt should return false for invalid extensions', () => {
		const invalidExts = ['.bmp', '.webp', '', '.ICO', '.JPG'];
		for (const ext of invalidExts) {
			expect(isFaviconExt(ext)).toBe(false);
		}
	});
});
