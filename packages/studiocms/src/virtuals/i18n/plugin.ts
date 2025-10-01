import { z } from 'astro/zod';

export const componentTranslationsSchema = z.record(z.string());
export const translationsSchema = z.record(componentTranslationsSchema);
export const pluginTranslationsSchema = z.record(translationsSchema);
export const pluginTranslationCollectionSchema = z.record(pluginTranslationsSchema);

export type ComponentTranslations = z.infer<typeof componentTranslationsSchema>;
export type Translations = z.infer<typeof translationsSchema>;
export type PluginTranslations = z.infer<typeof pluginTranslationsSchema>;
export type PluginTranslationCollection = z.infer<typeof pluginTranslationCollectionSchema>;

// const examplePlugin1: PluginTranslations = {
// 	en: {
// 		comp1: {
// 			title: 'Component Title',
// 			description: 'Component Description',
// 		},
// 	},
// 	fr: {
// 		comp1: {
// 			title: 'Titre du composant',
// 			description: 'Description du composant',
// 		},
// 	},
// };

// const examplePlugin2: PluginTranslations = {
// 	en: {
// 		comp2: {
// 			title: 'Component Title',
// 			description: 'Component Description',
// 		},
// 	},
// 	fr: {
// 		comp2: {
// 			title: 'Titre du composant',
// 			description: 'Description du composant',
// 		},
// 	},
// };

// const _examplePluginCollection: PluginTranslationCollection = {
// 	plugin1: examplePlugin1,
// 	plugin2: examplePlugin2,
// };
