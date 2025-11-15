import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { StudioCMSCoreError } from '../../../src/errors.js';
import { headDefaults } from '../../../src/virtuals/lib/headDefaults';
import { parentSuiteName, sharedTags } from '../../test-utils.js';

const localSuiteName = 'Head Defaults Virtual tests';

describe(parentSuiteName, () => {
	const AstroMock = { generator: 'Astro v3.0' };
	const title = 'Test Title';
	const description = 'Test Description';
	const lang = 'en';
	const favicon = '/favicon.png';
	const ogImage = 'https://example.com/og-image.png';
	const canonical = new URL('https://example.com');

	test('should generate default head tags with required fields', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('headDefaults test');
		const tags = [...sharedTags, 'lib:virtuals', 'function:headDefaults'];
		await allure.tags(...tags);

		await allure.step('Testing headDefaults with required fields', async () => {
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
						tag.tag === 'link' &&
						tag.attrs?.rel === 'canonical' &&
						tag.attrs?.href === canonical.href
				)
			).toBe(true);
			expect(
				result.some(
					(tag) =>
						tag.tag === 'meta' &&
						tag.attrs?.property === 'og:image' &&
						tag.attrs?.content === ogImage
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
	});

	test('should generate default head tags without optional ogImage and canonical', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('headDefaults test');
		const tags = [...sharedTags, 'lib:virtuals', 'function:headDefaults'];
		await allure.tags(...tags);

		await allure.step('Testing headDefaults without optional ogImage and canonical', async () => {
			const result = headDefaults(
				title,
				description,
				lang,
				// @ts-expect-error testing with mock
				AstroMock,
				favicon,
				undefined,
				undefined
			);

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

			expect(result.some((tag) => tag.tag === 'meta' && tag.attrs?.property === 'og:image')).toBe(
				false
			);
			expect(result.some((tag) => tag.tag === 'meta' && tag.attrs?.name === 'twitter:image')).toBe(
				false
			);
		});
	});

	test('should set correct favicon type for .png', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('headDefaults test');
		const tags = [...sharedTags, 'lib:virtuals', 'function:headDefaults'];
		await allure.tags(...tags);

		await allure.step('Testing favicon type for .png', async () => {
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
	});

	test('should throw StudioCMSCoreError for unsupported favicon extension', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('headDefaults test');
		const tags = [...sharedTags, 'lib:virtuals', 'function:headDefaults'];
		await allure.tags(...tags);

		await allure.step('Testing unsupported favicon extension', async () => {
			expect(() =>
				// @ts-expect-error testing with mock
				headDefaults(title, description, lang, AstroMock, '/favicon.bmp', ogImage, canonical)
			).toThrow(StudioCMSCoreError);
		});
	});
});
