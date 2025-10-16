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

import augmentTranslations from 'studiocms:i18n/augment-translations';
import { $locale, $localeSettings, defaultLang } from 'studiocms:i18n/client';
import pluginTranslations from 'studiocms:i18n/plugin-translations';
import { createI18n, type Messages } from '@nanostores/i18n';
import type { ComponentsJSON, TranslationsJSON } from '../../schemas/plugins/i18n';

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

/**
 * Augments the i18n instance specifically for handling "augments" translations.
 *
 * This function creates and returns an i18n instance configured to provide translation
 * data for the "augments" component, using a custom translation object per language.
 * If the requested language is not available, it falls back to the default language,
 * and if that is also unavailable, it returns an empty "augments" object.
 *
 * @remarks
 * Uses a type assertion hack to convince TypeScript that the translation objects
 * conform to the `ComponentsJSON` type.
 *
 * @returns The i18n instance for the "augments" component, initialized with the
 *          default language's "augments" translations or an empty object.
 */
export function $augmentI18n(): Messages<TranslationsJSON> {
	/**
	 * Small hack to convince TypeScript that this is a ComponentsJSON since its a custom
	 * object that only contains the augments component on each language.
	 */
	const isCompJson = (obj: unknown): ComponentsJSON => obj as ComponentsJSON;

	// Return the i18n instance for augments
	return createI18n($locale, {
		baseLocale: defaultLang,
		get: async (code) =>
			isCompJson(augmentTranslations[code]) ||
			isCompJson(augmentTranslations[defaultLang]) || { augments: {} },
	})('augments', augmentTranslations[defaultLang]?.augments || {});
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
