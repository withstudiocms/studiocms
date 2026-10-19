import { describe, expect } from 'vitest';
import {
	getCurrentURLPath,
	getLangFromUrl,
	staticPaths,
	switchLanguage,
	useTranslatedPath,
	useTranslations,
} from '../../../src/virtuals/i18n/server';
import { allureTester } from '../../fixtures/allureTester';
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
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

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

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'useTranslations tests',
				tags: [...tags],
				parameters: {
					key,
				},
			});

			await step(`Calling useTranslations with key "${key}"`, async () => {
				const t = useTranslations('en', '@studiocms/auth:login');
				// @ts-expect-error dynamic key
				const result = t(key);
				expect(result).toBe(expected);
			});
		});
	});

	test('useTranslatedPath returns path without lang prefix for English when showDefaultLang is false', async ({
		setupAllure,
		step,
	}) => {
		const tags = [...sharedTags, 'virtual:i18n', 'function:useTranslatedPath'];

		await setupAllure({
			subSuiteName: 'useTranslatedPath tests',
			tags: [...tags],
			parameters: {
				language: 'en',
			},
		});

		await step('Calling useTranslatedPath with "en"', async () => {
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

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'getLangFromUrl tests',
				tags: [...tags],
				parameters: {
					url,
				},
			});

			await step(`Calling getLangFromUrl with URL "${url}"`, async () => {
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

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'getCurrentURLPath tests',
				tags: [...tags],
				parameters: {
					pathname,
					referer: String(referer),
				},
			});

			await step(
				`Calling getCurrentURLPath with pathname "${pathname}" and referer "${referer}"`,
				async () => {
					const Astro = createAstroGlobal(pathname, referer);
					const result = getCurrentURLPath(Astro);
					expect(result).toBe(expected);
				}
			);
		});
	});

	test('switchLanguage switches path to selected language', async ({ setupAllure, step }) => {
		const tags = [...sharedTags, 'virtual:i18n', 'function:switchLanguage'];

		await setupAllure({
			subSuiteName: 'switchLanguage tests',
			tags: [...tags],
			parameters: {
				currentPath: '/dashboard',
				targetLanguage: 'en',
			},
		});

		await step('Calling switchLanguage to switch to "en"', async () => {
			const Astro = createAstroGlobal('/dashboard');
			const switcher = switchLanguage(Astro);
			const result = switcher('en');
			expect(result).toBe('/dashboard');
		});
	});

	test('staticPaths generates correct paths', async ({ setupAllure, step }) => {
		const tags = [...sharedTags, 'virtual:i18n', 'function:staticPaths'];

		await setupAllure({
			subSuiteName: 'staticPaths tests',
			tags: [...tags],
		});

		await step('Calling staticPaths', async () => {
			const paths = staticPaths();
			expect(paths).toContainEqual({ params: { locale: undefined } });
			expect(paths).not.toContainEqual({ params: { locale: 'en' } });
		});
	});
});
