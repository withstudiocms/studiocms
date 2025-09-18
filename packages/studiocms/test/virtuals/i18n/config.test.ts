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
		expect(i18nConfig.serverUiTranslations).toHaveProperty('fr');
		expect(i18nConfig.serverUiTranslations.fr.displayName).toBe('Français (fr)');
	});

	it('should list available UI translations', () => {
		expect(i18nConfig.uiTranslationsAvailable).toContain('en');
		expect(i18nConfig.uiTranslationsAvailable).toContain('fr');
	});

	it('should transform serverUiTranslations to clientUiTranslations', () => {
		expect(i18nConfig.clientUiTranslations.en).toEqual(
			i18nConfig.serverUiTranslations.en.translations
		);
		expect(i18nConfig.clientUiTranslations.fr).toEqual(
			i18nConfig.serverUiTranslations.fr.translations
		);
	});

	it('should set defaultLang to "en"', () => {
		expect(i18nConfig.defaultLang).toBe('en');
	});

	it('should set showDefaultLang to false', () => {
		expect(i18nConfig.showDefaultLang).toBe(false);
	});

	it('should generate sorted languageSelectorOptions', () => {
		const options = i18nConfig.languageSelectorOptions;
		expect(options).toContainEqual({ key: 'en', value: 'English (en)' });
		expect(options).toContainEqual({ key: 'fr', value: 'Français (fr)' });
		// Should be sorted alphabetically by value
		expect(options[0].value < options[1].value).toBe(true);
	});
});
