import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import {
	getCurrentURLPath,
	getLangFromUrl,
	staticPaths,
	switchLanguage,
	useTranslatedPath,
	useTranslations,
} from '../../../src/virtuals/i18n/server';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'i18n Server Virtuals tests';

// Mock AstroGlobal
function createAstroGlobal(pathname: string, referer?: string): any {
	return {
		url: new URL(`http://localhost${pathname}`),
		request: {
			headers: {
				get: (key: string) => (key === 'referer' ? referer : null),
			},
		},
	};
}

describe(parentSuiteName, () => {
	[
		{
			key: 'title',
			expected: 'Login Page',
		},
		{
			key: 'description',
			expected: 'Login Page',
		},
		{
			key: 'nonexistent',
			expected: 'nonexistent',
		},
		{
			key: 'unknown',
			expected: 'unknown',
		},
	].forEach(({ key, expected }) => {
		const testName = `useTranslations returns correct translation for key "${key}"`;
		const tags = [...sharedTags, 'virtual:i18n', 'function:useTranslations'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('useTranslations tests');
			await allure.tags(...tags);

			await allure.parameter('key', key);

			await allure.step(`Calling useTranslations with key "${key}"`, async () => {
				const t = useTranslations('en', '@studiocms/auth:login');
				// @ts-expect-error dynamic key
				const result = t(key);
				expect(result).toBe(expected);
			});
		});
	});

	test('useTranslatedPath returns path without lang prefix for English when showDefaultLang is false', async () => {
		const tags = [...sharedTags, 'virtual:i18n', 'function:useTranslatedPath'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('useTranslatedPath tests');
		await allure.tags(...tags);

		await allure.parameter('language', 'en');

		await allure.step('Calling useTranslatedPath with "en"', async () => {
			const translatePath = useTranslatedPath('en');
			const result = translatePath('/dashboard');
			expect(result).toBe('/dashboard');
		});
	});

	[
		{
			url: 'http://localhost/en/dashboard',
		},
		{
			url: 'http://localhost/dashboard',
		},
		{
			url: 'http://localhost/su/dashboard',
		},
	].forEach(({ url }) => {
		const testName = `getLangFromUrl extracts correct language from URL "${url}"`;
		const expectedLang = url.includes('/en/') || url === 'http://localhost/dashboard' ? 'en' : 'en';
		const tags = [...sharedTags, 'virtual:i18n', 'function:getLangFromUrl'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getLangFromUrl tests');
			await allure.tags(...tags);

			await allure.parameter('url', url);

			await allure.step(`Calling getLangFromUrl with URL "${url}"`, async () => {
				const result = getLangFromUrl(new URL(url));
				expect(result).toBe(expectedLang);
			});
		});
	});

	[
		{
			pathname: '/en/dashboard',
			referer: undefined,
			expected: '/dashboard',
		},
		{
			pathname: '/_server-islands',
			referer: 'http://localhost/en/dashboard',
			expected: '/dashboard',
		},
		{
			pathname: '/_server-islands',
			referer: 'http://localhost/dashboard',
			expected: '/dashboard',
		},
	].forEach(({ pathname, referer, expected }) => {
		const testName = `getCurrentURLPath returns correct path for pathname "${pathname}" and referer "${referer}"`;
		const tags = [...sharedTags, 'virtual:i18n', 'function:getCurrentURLPath'];

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('getCurrentURLPath tests');
			await allure.tags(...tags);

			await allure.parameter('pathname', pathname);
			await allure.parameter('referer', String(referer));

			await allure.step(
				`Calling getCurrentURLPath with pathname "${pathname}" and referer "${referer}"`,
				async () => {
					const Astro = createAstroGlobal(pathname, referer);
					const result = getCurrentURLPath(Astro);
					expect(result).toBe(expected);
				}
			);
		});
	});

	test('switchLanguage switches path to selected language', async () => {
		const tags = [...sharedTags, 'virtual:i18n', 'function:switchLanguage'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('switchLanguage tests');
		await allure.tags(...tags);

		await allure.parameter('currentPath', '/dashboard');
		await allure.parameter('targetLanguage', 'en');

		await allure.step('Calling switchLanguage to switch to "en"', async () => {
			const Astro = createAstroGlobal('/dashboard');
			const switcher = switchLanguage(Astro);
			const result = switcher('en');
			expect(result).toBe('/dashboard');
		});
	});

	test('staticPaths generates correct paths', async () => {
		const tags = [...sharedTags, 'virtual:i18n', 'function:staticPaths'];

		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('staticPaths tests');
		await allure.tags(...tags);

		await allure.step('Calling staticPaths', async () => {
			const paths = staticPaths();
			expect(paths).toContainEqual({ params: { locale: undefined } });
			expect(paths).not.toContainEqual({ params: { locale: 'en' } });
		});
	});
});
