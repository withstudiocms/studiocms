import type { APIContext } from 'astro';
import { translationFlagKeyOverrides } from '../src/virtuals/i18n/overrides';
import {
	buildAvailableTranslations,
	type LanguageFlagIdentifier,
} from '../src/virtuals/i18n/utils';
import { StudioCMSRoutes } from '../src/virtuals/lib/routeMap';

export const parentSuiteName = 'studiocms Tests';
export const sharedTags = ['package:studiocms', 'type:unit'];

export function cleanAstroAttributes(str: string, mockPath: string): string {
	const regex1 = /\s*data-astro-[a-zA-Z0-9-]*(?:="[^"]*")?/g;
	const replacer1 = '';
	const regex2 = /src="[^"?]*(\?[^"]*)"/g;
	const replacer2 = (_: string, p1: string) => `src="${mockPath}${p1}"`;
	const regex3 = /(<meta name="generator" content="Astro v)[0-9]+\.[0-9]+\.[0-9]+(")/g;
	const replacer3 = '$10.0.0-test$2';
	const regex4 = /(<img[^>]*href=)[^&"]*(&[^>]*>|"[^>]*>)/g;
	const replacer4 = '$1%2Fmock%2Fpath%2Fimage.webp$2';

	return str
		.replace(regex1, replacer1)
		.replace(regex2, replacer2)
		.replace(regex3, replacer3)
		.replace(regex4, replacer4);
}

export const makeRendererProps = (content: string | null) => ({
	data: {
		package: 'mock/render',
		defaultContent: {
			contentLang: 'default',
			contentId: 'mocked',
			id: 'mocked',
			content,
		},
	},
});

export const MockAstroLocals = (): APIContext['locals'] => {
	const date = new Date();
	return {
		StudioCMS: {
			siteConfig: {
				id: '',
				data: {
					title: 'Test Site',
					description: 'A test site for StudioCMS',
					defaultOgImage: 'https://example.com/default-og-image.png',
					diffPerPage: 10,
					enableDiffs: false,
					enableMailer: false,
					gridItems: [],
					loginPageBackground: 'studiocms-curves',
					loginPageCustomImage: null,
					siteIcon: null,
					_config_version: '1.0.0',
				},
			},
			defaultLang: 'en',
			latestVersion: {
				lastCacheUpdate: date,
				version: '0.0.0-test',
			},
			SCMSGenerator: 'StudioCMS v0.0.0-test',
			SCMSUiGenerator: 'StudioCMS UI v0.0.0-test',
			routeMap: StudioCMSRoutes,
		},
	};
};

/**
 * Dynamically imports the base English translations for server-side internationalization.
 *
 * @remarks
 * This constant loads the default English translation JSON file asynchronously at runtime.
 * It is intended to be used as the base set of translations for the server.
 *
 * - These translations are also converted to a client-friendly format.
 */
export const baseServerTranslations = (
	await import('../src/virtuals/i18n/translations/en.json', {
		with: { type: 'json' },
	})
).default;

/**
 * Represents a translation record for StudioCMS.
 *
 * @property displayName - The human-readable name for the translation.
 * @property translations - The translation data in the form of a ComponentsJSON object.
 */
export type StudioCMSTranslationRecord = typeof baseServerTranslations;

/**
 * A record mapping translation file keys (e.g., 'en', 'fr') to their corresponding translation data.
 */
export const translationFiles: Record<string, StudioCMSTranslationRecord> = {
	// Base translations
	en: baseServerTranslations,

	// Additional translations can be added here
	de: (
		await import('../src/virtuals/i18n/translations/de.json', {
			with: { type: 'json' },
		})
	).default,
	es: (
		await import('../src/virtuals/i18n/translations/es.json', {
			with: { type: 'json' },
		})
	).default,
	fr: (
		await import('../src/virtuals/i18n/translations/fr.json', {
			with: { type: 'json' },
		})
	).default,
	// @ts-expect-error There is a type mismatch in the Hindi translation file. (likely out of sync with the base definition)
	hi: (
		await import('../src/virtuals/i18n/translations/hi.json', {
			with: { type: 'json' },
		})
	).default,
	nl: (
		await import('../src/virtuals/i18n/translations/nl.json', {
			with: { type: 'json' },
		})
	).default,
	no: (
		await import('../src/virtuals/i18n/translations/no.json', {
			with: { type: 'json' },
		})
	).default,
	zh: (
		await import('../src/virtuals/i18n/translations/zh.json', {
			with: { type: 'json' },
		})
	).default,
};

/**
 * An array of translation file keys derived from `availableTranslationFiles`.
 *
 * @example
 * // availableTranslationFileKeys = ['en', 'fr']
 */
export const availableTranslationFileKeys = Object.keys(translationFiles);

export const availableTranslations = (() =>
	buildAvailableTranslations(
		availableTranslationFileKeys.filter((key) => key !== 'en'),
		translationFiles
	))();

export const availableTranslationsKeys = ['en', ...Object.keys(availableTranslations)];

export const currentFlags: Array<{ key: string; flag: LanguageFlagIdentifier }> =
	availableTranslationsKeys.map((key) => {
		const flagKey: LanguageFlagIdentifier = translationFlagKeyOverrides[key] || `lang-${key}`;
		return { key, flag: flagKey };
	});
