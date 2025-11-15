import { describe, expect } from 'vitest';
import * as i18nConfig from '../../../src/virtuals/i18n/config';
import { allureTester } from '../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'i18n Config tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	[
		{
			object: i18nConfig.baseServerTranslations,
			toHave: 'displayName',
			expected: 'English (en)',
		},
		{
			object: i18nConfig.baseServerTranslations.translations,
			toHave: ['@studiocms/auth:login', 'title'],
			expected: 'Login Page',
		},
	].forEach(({ object, toHave, expected }) => {
		const testName = `baseServerTranslations has property ${Array.isArray(toHave) ? toHave.join('.') : toHave}`;
		const tags = [...sharedTags, 'virtual:i18n', 'config:baseServerTranslations'];

		test(testName, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'baseServerTranslations tests',
				tags: [...tags],
				parameters: {
					property: Array.isArray(toHave) ? toHave.join('.') : toHave,
				},
			});

			await step(
				`Checking property ${Array.isArray(toHave) ? toHave.join('.') : toHave}`,
				async () => {
					expect(object).toHaveProperty(toHave, expected);
				}
			);
		});
	});

	test('should include correct properties in serverUiTranslations', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'serverUiTranslations tests',
			tags: [...sharedTags, 'virtual:i18n', 'config:serverUiTranslations'],
		});

		await step('Checking serverUiTranslations properties', async () => {
			expect(i18nConfig.serverUiTranslations).toHaveProperty('en');
		});
	});

	test('should list available UI translations', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'uiTranslationsAvailable tests',
			tags: [...sharedTags, 'virtual:i18n', 'config:uiTranslationsAvailable'],
		});

		await step('Checking uiTranslationsAvailable contents', async () => {
			expect(i18nConfig.uiTranslationsAvailable).toContain('en');
		});
	});

	test('should transform serverUiTranslations to clientUiTranslations', async ({
		setupAllure,
		step,
	}) => {
		await setupAllure({
			subSuiteName: 'clientUiTranslations tests',
			tags: [...sharedTags, 'virtual:i18n', 'config:clientUiTranslations'],
		});

		await step('Checking clientUiTranslations contents', async () => {
			expect(i18nConfig.clientUiTranslations.en).toEqual(
				i18nConfig.serverUiTranslations.en.translations
			);
		});
	});

	test('should set defaultLang to "en"', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'defaultLang tests',
			tags: [...sharedTags, 'virtual:i18n', 'config:defaultLang'],
		});

		await step('Checking defaultLang value', async () => {
			expect(i18nConfig.defaultLang).toBe('en');
		});
	});

	test('should generate sorted languageSelectorOptions', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'languageSelectorOptions tests',
			tags: [...sharedTags, 'virtual:i18n', 'config:languageSelectorOptions'],
		});

		await step('Checking languageSelectorOptions contents', async () => {
			const options = i18nConfig.languageSelectorOptions;
			expect(options).toContainEqual({
				key: 'en',
				displayName: 'English (en)',
				flag: 'lang-en-us',
			});
			expect(options.length).toBeGreaterThan(0);
		});
	});
});
