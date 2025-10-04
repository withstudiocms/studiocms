import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';
import type { PluginTranslations } from '../schemas/plugins/i18n.js';

/**
 * Load translations from JavaScript files.
 *
 * @param path - The path to the directory containing the translation files.
 * @param base - The base URL for resolving the path.
 * @returns A promise that resolves to an object containing the loaded translations.
 */
export async function loadJsTranslations(path: string, base: string): Promise<PluginTranslations> {
	const translations: PluginTranslations = {};

	const translationsDir = fileURLToPath(new URL(path, base));

	const availableTranslationFiles = await glob('**/*.js', { cwd: translationsDir });

	for (const file of availableTranslationFiles) {
		const alias = file.replace(/\.js$/, '');
		const translation = await import(/* @vite-ignore */ `${translationsDir}/${file}`);
		translations[alias] = translation.default;
	}

	return translations;
}

/**
 * Build translations object.
 *
 * @param translations - The translations object.
 * @returns A promise that resolves to an object containing the built translations.
 */
export async function buildTranslations(translations: PluginTranslations) {
	return {
		/**
		 * Get raw translations.
		 */
		rawTranslations: translations,

		/**
		 * Get component translations.
		 *
		 * @param lang - The language code.
		 * @param comp - The component name.
		 * @returns The component translations.
		 */
		getComponent: (lang: string, comp: string) => {
			const translation = translations[lang];
			return translation[comp];
		},
		/**
		 * Build page title.
		 *
		 * @param comp - The component name.
		 * @param key - The key for the title.
		 * @returns The page title.
		 */
		buildPageTitle: (comp: string, key: string) => {
			const _translations: Record<string, string> = {};

			for (const lang in translations) {
				_translations[lang] = translations[lang][comp][key];
			}

			return _translations;
		},
	};
}
