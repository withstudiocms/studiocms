import { $locale, $localeSettings, defaultLang } from 'studiocms:i18n/client';
import pluginTranslations from 'studiocms:i18n/plugin-translations';
import { createI18n } from '@nanostores/i18n';

export class PluginTranslations extends HTMLElement {
	currentLang: string | undefined;

	constructor() {
		super();

		$localeSettings.subscribe((val) => {
			this.currentLang = val;
		});
	}

	connectedCallback() {
		const pluginId = this.getAttribute('plugin');
		const componentId = this.getAttribute('component');
		const key = this.getAttribute('key');

		if (!pluginId || !componentId || !key) {
			console.error('Missing required attributes');
			return;
		}

		const translations = pluginTranslations[pluginId];
		const base = translations[defaultLang];

		const i18n = createI18n($locale, {
			baseLocale: defaultLang,
			get: async (code) => translations[code] ?? translations[defaultLang],
		})(componentId, base[componentId]);

		i18n.subscribe((comp) => {
			const translation = comp[key];

			if (typeof translation === 'string' && translation.trim() === '') {
				return;
			}

			this.textContent = translation;
		});
	}
}
