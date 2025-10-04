/**
 * This module handles internationalization (i18n) for the StudioCMS application on the client side.
 *
 * It provides utilities for loading and managing translation files, as well as functions for
 * retrieving translated strings based on the current language context.
 *
 * If you are interested in contributing to the translation effort, please visit our Crowdin project:
 * https://crowdin.com/project/studiocms or submit a pull request to the `translations` folder:
 * `packages/studiocms/src/virtuals/i18n/translations/` on https://github.com/withstudiocms/studiocms
 */

import { $locale, $localeSettings, defaultLang } from 'studiocms:i18n/client';
import pluginTranslations from 'studiocms:i18n/plugin-translations';
import { createI18n, type Messages } from '@nanostores/i18n';
import type { TranslationsJSON } from '../../schemas/plugins/i18n';

export function $pluginI18n(pluginId: string, componentId: string): Messages<TranslationsJSON> {
	const translations = pluginTranslations[pluginId];

	if (!translations || !translations[defaultLang]) {
		console.warn(`[i18n] Missing translations for plugin "${pluginId}".`);
		return createI18n($locale, {
			baseLocale: defaultLang,
			get: async () => ({}),
		})(componentId, {});
	}

	const base = translations[defaultLang] ?? {};
	const componentBase = base[componentId] ?? {};
	return createI18n($locale, {
		baseLocale: defaultLang,
		get: async (code) => translations[code] ?? base,
	})(componentId, componentBase);
}

export class PluginTranslations extends HTMLElement {
	currentLang: string | undefined;
	unsubscribeLocale?: () => void;
	unsubscribeTranslations?: () => void;

	constructor() {
		super();

		this.unsubscribeLocale = $localeSettings.subscribe((val) => {
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

		const i18n = $pluginI18n(pluginId, componentId);

		this.unsubscribeTranslations?.();
		this.unsubscribeTranslations = i18n.subscribe((comp) => {
			const translation = comp[key];

			if (typeof translation === 'string' && translation.trim() === '') {
				return;
			}

			this.textContent = translation;
		});
	}

	disconnectedCallback() {
		this.unsubscribeTranslations?.();
		this.unsubscribeLocale?.();
	}
}
