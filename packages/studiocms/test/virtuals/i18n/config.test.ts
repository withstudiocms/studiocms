import { describe, expect, it } from 'vitest';
import * as i18nConfig from '../../../src/virtuals/i18n/config';

// Import after mocks

describe('i18n/config', () => {
	it('should define baseServerTranslations with English translations', () => {
		expect(i18nConfig.baseServerTranslations).toHaveProperty('displayName', 'English (en)');
		expect(i18nConfig.baseServerTranslations.translations).toHaveProperty(
			['@studiocms/auth:login', 'title'],
			'Login Page'
		);
	});

	it('should include availableTranslations in serverUiTranslations', () => {
		expect(i18nConfig.serverUiTranslations).toHaveProperty('en');
	});

	it('should list available UI translations', () => {
		expect(i18nConfig.uiTranslationsAvailable).toContain('en');
	});

	it('should transform serverUiTranslations to clientUiTranslations', () => {
		expect(i18nConfig.clientUiTranslations.en).toEqual(
			i18nConfig.serverUiTranslations.en.translations
		);
	});

	it('should set defaultLang to "en"', () => {
		expect(i18nConfig.defaultLang).toBe('en');
	});

	it('should generate sorted languageSelectorOptions', () => {
		const options = i18nConfig.languageSelectorOptions;
		expect(options).toContainEqual({ key: 'en', displayName: 'English (en)', flag: 'lang-en-us' });
		expect(options.length).toBeGreaterThan(0);
	});
});
