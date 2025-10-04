import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';
import type { PluginTranslations } from '../schemas/plugins/i18n.js';

export async function loadJsTranslations(path: string, base: string): Promise<PluginTranslations> {
	const translations: PluginTranslations = {};

	const translationsDir = fileURLToPath(new URL(path, base));

	const availableTranslationFiles = await glob('**/*.{ts,js}', { cwd: translationsDir });

	for (const file of availableTranslationFiles) {
		const alias = file.replace(/\.ts$/, '').replace(/\.js$/, '');
		const translation = await import(/* @vite-ignore */ `${translationsDir}/${file}`);
		translations[alias] = translation.default;
	}

	return translations;
}

export async function buildTranslations(translations: PluginTranslations) {
	return {
		rawTranslations: translations,
		getComponent: (lang: string, comp: string) => {
			const translation = translations[lang];
			return translation[comp];
		},
		buildPageTitle: (comp: string, key: string) => {
			const _translations: Record<string, string> = {};

			for (const lang in translations) {
				_translations[lang] = translations[lang][comp][key];
			}

			return _translations;
		},
	};
}
