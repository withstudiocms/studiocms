import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
		// import() takes a URL, not a filesystem path. A bare path works on Linux by accident;
		// on Windows `E:\...` parses as a URL with scheme `e:` and Node rejects it
		// (ERR_UNSUPPORTED_ESM_URL_SCHEME), which killed `astro dev` at config load.
		const translation = await import(
			/* @vite-ignore */ pathToFileURL(join(translationsDir, file)).href
		);
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
			const langTranslations = translations[lang];
			if (!langTranslations) {
				return undefined;
			}

			return langTranslations[comp];
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

			for (const lang of Object.keys(translations)) {
				const langTranslations = translations[lang];
				const componentTranslations = langTranslations?.[comp];

				if (componentTranslations && typeof componentTranslations[key] === 'string') {
					_translations[lang] = componentTranslations[key];
				}
			}

			return _translations;
		},
	};
}
