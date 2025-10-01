import { z } from 'astro/zod';

export interface TranslationsJSON {
	[key: string]: string;
}

export interface ComponentsJSON {
	[component: string]: TranslationsJSON;
}

export interface PluginTranslations {
	[language: string]: ComponentsJSON;
}

export interface PluginTranslationCollection {
	[plugin: string]: PluginTranslations;
}

export const pluginTranslationsSchema = z.custom<PluginTranslations>();
export const pluginTranslationCollectionSchema = z.custom<PluginTranslationCollection>();

// const plugins: PluginTranslationCollection = {
// 	'default-grid': {
// 		en: {
// 			'grid-item-1': {
// 				title: 'Grid Item 1',
// 				description: 'This is the first grid item.',
// 			},
// 			'grid-item-2': {
// 				title: 'Grid Item 2',
// 				description: 'This is the second grid item.',
// 			},
// 		},
// 		fr: {
// 			'grid-item-1': {
// 				title: 'Élément de grille 1',
// 				description: 'Ceci est le premier élément de grille.',
// 			},
// 			'grid-item-2': {
// 				title: 'Élément de grille 2',
// 				description: 'Ceci est le deuxième élément de grille.',
// 			},
// 		},
// 	},
// 	'web-vitals': {
// 		en: {
// 			'vital-1': {
// 				title: 'Vital 1',
// 				description: 'This is the first vital.',
// 			},
// 			'vital-2': {
// 				title: 'Vital 2',
// 				description: 'This is the second vital.',
// 			},
// 		},
// 		fr: {
// 			'vital-1': {
// 				title: 'Vital 1',
// 				description: 'Ceci est le premier vital.',
// 			},
// 			'vital-2': {
// 				title: 'Vital 2',
// 				description: 'Ceci est le deuxième vital.',
// 			},
// 		},
// 	},
// };
