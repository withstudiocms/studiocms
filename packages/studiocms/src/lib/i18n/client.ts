import {
	type ComponentsJSON,
	type Messages,
	type Translations,
	browser,
	createI18n,
	formatter,
	localeFrom,
} from '@nanostores/i18n';
import { persistentAtom } from '@nanostores/persistent';
import { type UiTranslationKey, defaultLang, uiTranslationsAvailable } from './config.js';

export const baseTranslation = (await import('./translations/en.json')).translations;

export { defaultLang, type UiTranslationKey, uiTranslationsAvailable };

const localeMap: Record<UiTranslationKey, ComponentsJSON> = {
	en: baseTranslation,
	de: (await import('./translations/de.json')).translations,
	es: (await import('./translations/es.json')).translations,
	fr: (await import('./translations/fr.json')).translations,
};

export const $localeSettings = persistentAtom<UiTranslationKey | undefined>(
	'studiocms-i18n-locale',
	defaultLang
);

export const $locale = localeFrom(
	$localeSettings, // User’s locale from localStorage
	browser({
		// or browser’s locale auto-detect
		available: uiTranslationsAvailable,
	})
);

export const format = formatter($locale);

export const $i18n = createI18n($locale, {
	baseLocale: defaultLang,
	get: async (code: UiTranslationKey) => {
		return localeMap[code] as ComponentsJSON;
	},
});

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const documentUpdater = (comp: any, lang: string) => {
	document.title = comp.title;
	document.querySelector('meta[name="description"]')?.setAttribute('content', comp.description);

	document.documentElement.lang = lang;
};

/**
 * Create a custom element that will update its text content
 * when the translation changes.
 */
export const makeTranslation = <Body extends Translations>(
	currentPage: keyof typeof baseTranslation,
	i18n: Messages<Body>
) => {
	return class Translation extends HTMLElement {
		connectedCallback() {
			const key = this.getAttribute('key') as keyof (typeof baseTranslation)[typeof currentPage];
			if (key) {
				i18n.subscribe((comp) => {
					this.innerText = comp[key] as string;
				});
			}
		}
	};
};

const requiredLabelRegex = /.*?<span class="req-star.*?>\*<\/span>/;

export const updateElmLabel = (el: string, translation: string) => {
	const label = document
		.querySelector<HTMLLabelElement>(`label[for="${el}"]`)
		?.querySelector('.label') as HTMLSpanElement;

	if (requiredLabelRegex.test(label.innerHTML)) {
		label.innerHTML = `${translation} <span class="req-star">*</span>`;
		return;
	}
	label.textContent = translation;
};

export const updateElmPlaceholder = (el: string, translation: string) => {
	const input = document.querySelector<HTMLInputElement>(`#${el}`) as HTMLInputElement;
	input.placeholder = translation;
};

export const updateSelectElmLabel = (el: string, translation: string) => {
	const label = document.querySelector<HTMLLabelElement>(
		`label[for="${el}-select-btn"]`
	) as HTMLLabelElement;

	if (requiredLabelRegex.test(label.innerHTML)) {
		label.innerHTML = `${translation} <span class="req-star">*</span>`;
		return;
	}
	label.textContent = translation;
};

export const updateToggleElmLabel = (el: string, translation: string) => {
	const label = document.querySelector<HTMLLabelElement>(`label[for="${el}"]`) as HTMLLabelElement;

	const span = label.querySelector(`#label-${el}`) as HTMLSpanElement;

	if (requiredLabelRegex.test(span.innerHTML)) {
		span.innerHTML = `${translation} <span class="req-star">*</span>`;
		return;
	}
	span.textContent = translation;
};

export const pageHeaderUpdater = (translation: string) => {
	const pageHeader = document.querySelector('.page-header') as HTMLElement;
	const header = pageHeader.querySelector('.page-title') as HTMLElement;

	header.textContent = translation;
};
