import { describe, expect, it } from 'vitest';
import { StudioCMSCoreError } from '../../../src/errors.js';
import { headDefaults } from '../../../src/virtuals/lib/headDefaults';

describe('headDefaults', () => {
	const AstroMock = { generator: 'Astro v3.0' };
	const title = 'Test Title';
	const description = 'Test Description';
	const lang = 'en';
	const favicon = '/favicon.png';
	const ogImage = 'https://example.com/og-image.png';
	const canonical = new URL('https://example.com');

	it('should generate default head tags with required fields', () => {
		// @ts-expect-error testing with mock
		const result = headDefaults(title, description, lang, AstroMock, favicon, ogImage, canonical);

		expect(Array.isArray(result)).toBe(true);
		expect(result.some((tag) => tag.tag === 'title' && tag.content === title)).toBe(true);
		expect(
			result.some(
				(tag) =>
					tag.tag === 'meta' &&
					tag.attrs?.name === 'description' &&
					tag.attrs?.content === description
			)
		).toBe(true);
		expect(
			result.some(
				(tag) =>
					tag.tag === 'link' && tag.attrs?.rel === 'canonical' && tag.attrs?.href === canonical.href
			)
		).toBe(true);
		expect(
			result.some(
				(tag) =>
					tag.tag === 'meta' && tag.attrs?.property === 'og:image' && tag.attrs?.content === ogImage
			)
		).toBe(true);
		expect(
			result.some(
				(tag) =>
					tag.tag === 'meta' &&
					tag.attrs?.name === 'twitter:image' &&
					tag.attrs?.content === ogImage
			)
		).toBe(true);
	});

	it('should not include og:image and twitter:image if ogImage is undefined', () => {
		// @ts-expect-error testing with mock
		const result = headDefaults(title, description, lang, AstroMock, favicon, undefined, canonical);

		expect(result.some((tag) => tag.tag === 'meta' && tag.attrs?.property === 'og:image')).toBe(
			false
		);
		expect(result.some((tag) => tag.tag === 'meta' && tag.attrs?.name === 'twitter:image')).toBe(
			false
		);
	});

	it('should throw StudioCMSCoreError for unsupported favicon extension', () => {
		expect(() =>
			// @ts-expect-error testing with mock
			headDefaults(title, description, lang, AstroMock, '/favicon.bmp', ogImage, canonical)
		).toThrow(StudioCMSCoreError);
	});

	it('should set correct favicon type for .png', () => {
		const result = headDefaults(
			title,
			description,
			lang,
			// @ts-expect-error testing with mock
			AstroMock,
			'/favicon.png',
			ogImage,
			canonical
		);
		const faviconTag = result.find(
			(tag) => tag.tag === 'link' && tag.attrs?.rel === 'shortcut icon'
		);
		expect(faviconTag?.attrs?.type).toBe('image/png');
		expect(faviconTag?.attrs?.href).toBe('/favicon.png');
	});

	it('should handle canonical as undefined', () => {
		// @ts-expect-error testing with mock
		const result = headDefaults(title, description, lang, AstroMock, favicon, ogImage, undefined);
		expect(
			result.some(
				(tag) =>
					tag.tag === 'link' && tag.attrs?.rel === 'canonical' && tag.attrs?.href === undefined
			)
		).toBe(true);
		expect(
			result.some(
				(tag) =>
					tag.tag === 'meta' && tag.attrs?.property === 'og:url' && tag.attrs?.content === undefined
			)
		).toBe(true);
	});
});
