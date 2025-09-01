import {
	browser,
	createI18n,
	formatter,
	localeFrom,
	type Messages,
	type Translations,
} from '@nanostores/i18n';
import { persistentAtom } from '@nanostores/persistent';
import {
	baseServerTranslations,
	clientUiTranslations,
	defaultLang,
	type UiTranslationKey,
	uiTranslationsAvailable,
} from './config.js';

export { defaultLang, type UiTranslationKey, uiTranslationsAvailable };

/**
 * The base translation object containing all translations for the default language.
 */
export const baseTranslation = baseServerTranslations.translations;

/**
 * A mapping of UI translation keys to their localized strings.
 */
const localeMap = clientUiTranslations;

/**
 * A persistent atom representing the user's locale settings.
 */
export const $localeSettings = persistentAtom<UiTranslationKey | undefined>(
	'studiocms-i18n-locale',
	defaultLang
);

/**
 * A locale store derived from the user's locale settings and browser detection.
 */
export const $locale = localeFrom(
	$localeSettings, // User’s locale from localStorage
	browser({
		// or browser’s locale auto-detect
		available: uiTranslationsAvailable,
	})
);

/**
 * A formatter function for the current locale.
 */
export const format = formatter($locale);

/**
 * An i18n (internationalization) utility instance for client-side usage.
 *
 * @remarks
 * This instance is created using the `createI18n` function, initialized with the current locale and a base locale.
 * It provides a `get` method to asynchronously retrieve translations for a given UI translation key from the `localeMap`.
 *
 * @example
 * ```typescript
 * const translation = await $i18n.get('welcome_message');
 * ```
 *
 * @see createI18n
 *
 * @param $locale - The current locale store or value.
 * @param defaultLang - The default language to use as a base locale.
 * @param localeMap - An object mapping translation keys to their localized strings.
 */
export const $i18n = createI18n($locale, {
	baseLocale: defaultLang,
	get: async (code: UiTranslationKey) => {
		return localeMap[code];
	},
});

/**
 * Updates the document's title, meta description, and language attribute based on the provided component and language.
 *
 * @param comp - An object containing the `title` and `description` properties to update the document's title and meta description.
 * @param lang - The language code to set as the value of the document's `lang` attribute.
 */
// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any
export const documentUpdater = (comp: any, lang: string) => {
	document.title = comp.title;
	document.querySelector('meta[name="description"]')?.setAttribute('content', comp.description);

	document.documentElement.lang = lang;
};

type BaseTranslation = typeof baseTranslation;
type BaseTranslationKeys = keyof BaseTranslation;

/**
 * Create a custom element that will update its text content
 * when the translation changes.
 */
export const makeTranslation = <Body extends Translations>(
	currentPage: BaseTranslationKeys,
	i18n: Messages<Body>
) => {
	const currentTranslations = currentPage;
	type CurrentTranslations = typeof currentTranslations;

	return class Translation extends HTMLElement {
		connectedCallback() {
			const key = this.getAttribute('key') as keyof BaseTranslation[CurrentTranslations];
			if (key) {
				i18n.subscribe((comp) => {
					this.innerText = comp[key] as string;
				});
			}
		}
	};
};

/**
 * Regular expression to match required field indicators in labels.
 */
const requiredLabelRegex = /.*?<span class="req-star.*?>\*<\/span>/;

/**
 * Updates the label text for a given form element with a translated string.
 *
 * Searches for a `<label>` element associated with the specified element ID (`el`)
 * and updates its child element with the class `.label` to display the provided translation.
 * If the label's inner HTML matches the `requiredLabelRegex`, it appends a required star indicator.
 *
 * @param el - The ID of the form element whose label should be updated.
 * @param translation - The translated string to set as the label's text.
 */
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

/**
 * Updates the placeholder text of an input element with the specified ID.
 *
 * @param el - The ID of the input element whose placeholder should be updated.
 * @param translation - The new placeholder text to set for the input element.
 *
 * @remarks
 * This function queries the DOM for an input element with the given ID and sets its
 * `placeholder` property to the provided translation string.
 *
 * @throws {TypeError} If no element with the specified ID is found, or if the element is not an input.
 */
export const updateElmPlaceholder = (el: string, translation: string) => {
	const input = document.querySelector<HTMLInputElement>(`#${el}`) as HTMLInputElement;
	input.placeholder = translation;
};

/**
 * Updates the label of a select element with a translated string.
 *
 * Finds the corresponding `<label>` element for the given select element by its `for` attribute,
 * and updates its content with the provided translation. If the label contains a required field indicator
 * (as determined by `requiredLabelRegex`), it preserves the required star (`*`) in the label.
 *
 * @param el - The base ID of the select element (without the `-select-btn` suffix).
 * @param translation - The translated string to set as the label's text.
 */
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

/**
 * Updates the label text for a toggle element with a given translation.
 *
 * This function locates the `<label>` element associated with the provided element ID (`el`),
 * then finds the corresponding `<span>` inside the label with the ID `label-${el}`.
 * If the span's inner HTML matches the `requiredLabelRegex`, it updates the span's inner HTML
 * to include the translated text and a required star indicator. Otherwise, it simply updates
 * the span's text content with the translation.
 *
 * @param el - The ID of the element whose label should be updated.
 * @param translation - The translated text to set as the label.
 */
export const updateToggleElmLabel = (el: string, translation: string) => {
	const label = document.querySelector<HTMLLabelElement>(`label[for="${el}"]`) as HTMLLabelElement;

	const span = label.querySelector(`#label-${el}`) as HTMLSpanElement;

	if (requiredLabelRegex.test(span.innerHTML)) {
		span.innerHTML = `${translation} <span class="req-star">*</span>`;
		return;
	}
	span.textContent = translation;
};

/**
 * Updates the text content of the page header's title element with the provided translation.
 *
 * @param translation - The translated string to set as the page title.
 *
 * @remarks
 * This function selects the element with the class `.page-header` and then finds its child
 * with the class `.page-title`, updating its text content to the given translation.
 * It assumes that both elements exist in the DOM.
 */
export const pageHeaderUpdater = (translation: string) => {
	const pageHeader = document.querySelector('.page-header') as HTMLElement;
	const header = pageHeader.querySelector('.page-title') as HTMLElement;

	header.textContent = translation;
};
