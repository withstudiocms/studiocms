import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import * as i18nConfig from '../../../src/virtuals/i18n/config';
import { parentSuiteName, sharedTags } from '../../test-utils';

const localSuiteName = 'i18n Config tests';

describe(parentSuiteName, () => {
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

		test(testName, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('baseServerTranslations tests');
			await allure.tags(...tags);

			await allure.parameter('property', Array.isArray(toHave) ? toHave.join('.') : toHave);

			await allure.step(
				`Checking property ${Array.isArray(toHave) ? toHave.join('.') : toHave}`,
				async () => {
					expect(object).toHaveProperty(toHave, expected);
				}
			);
		});
	});

	test('should include correct properties in serverUiTranslations', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('serverUiTranslations tests');
		await allure.tags(...[...sharedTags, 'virtual:i18n', 'config:serverUiTranslations']);

		await allure.step('Checking serverUiTranslations properties', async () => {
			expect(i18nConfig.serverUiTranslations).toHaveProperty('en');
		});
	});

	test('should list available UI translations', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('uiTranslationsAvailable tests');
		await allure.tags(...[...sharedTags, 'virtual:i18n', 'config:uiTranslationsAvailable']);

		await allure.step('Checking uiTranslationsAvailable contents', async () => {
			expect(i18nConfig.uiTranslationsAvailable).toContain('en');
		});
	});

	test('should transform serverUiTranslations to clientUiTranslations', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('clientUiTranslations tests');
		await allure.tags(...[...sharedTags, 'virtual:i18n', 'config:clientUiTranslations']);

		await allure.step('Checking clientUiTranslations contents', async () => {
			expect(i18nConfig.clientUiTranslations.en).toEqual(
				i18nConfig.serverUiTranslations.en.translations
			);
		});
	});

	test('should set defaultLang to "en"', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('defaultLang tests');
		await allure.tags(...[...sharedTags, 'virtual:i18n', 'config:defaultLang']);

		await allure.step('Checking defaultLang value', async () => {
			expect(i18nConfig.defaultLang).toBe('en');
		});
	});

	test('should generate sorted languageSelectorOptions', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('languageSelectorOptions tests');
		await allure.tags(...[...sharedTags, 'virtual:i18n', 'config:languageSelectorOptions']);

		await allure.step('Checking languageSelectorOptions contents', async () => {
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
