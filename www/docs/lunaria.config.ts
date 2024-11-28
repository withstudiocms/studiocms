import { defineConfig } from '@lunariajs/core/config';

export default defineConfig({
	repository: {
		name: 'withstudiocms/studiocms',
		rootDir: 'www/docs',
		hosting: 'github',
		// TODO: Change/Remove this once the branch is ready to merge
		branch: 'docs-i18n',
	},
	sourceLocale: {
		label: 'English',
		lang: 'en',
		parameters: {
			tag: 'en',
		},
	},
	locales: [
		{
			label: 'Español',
			lang: 'es',
			parameters: {
				tag: 'es',
			},
		},
		{
			label: 'Français',
			lang: 'fr',
			parameters: {
				tag: 'fr',
			},
		},
		// {
		// 	label: 'Deutsch',
		// 	lang: 'de',
		// 	parameters: {
		// 		tag: 'de',
		// 	},
		// },
		// {
		// 	label: '日本語',
		// 	lang: 'ja',
		// 	parameters: {
		// 		tag: 'ja',
		// 	},
		// },
		// {
		// 	label: 'Italiano',
		// 	lang: 'it',
		// 	parameters: {
		// 		tag: 'it',
		// 	},
		// },
		// {
		// 	label: 'Bahasa Indonesia',
		// 	lang: 'id',
		// 	parameters: {
		// 		tag: 'id',
		// 	},
		// },
		// {
		// 	label: '简体中文',
		// 	lang: 'zh-cn',
		// 	parameters: {
		// 		tag: 'zh-CN',
		// 	},
		// },
		// {
		// 	label: 'Português do Brasil',
		// 	lang: 'pt-br',
		// 	parameters: {
		// 		tag: 'pt-BR',
		// 	},
		// },
		// {
		// 	label: 'Português',
		// 	lang: 'pt-pt',
		// 	parameters: {
		// 		tag: 'pt-PT',
		// 	},
		// },
		// {
		// 	label: '한국어',
		// 	lang: 'ko',
		// 	parameters: {
		// 		tag: 'ko',
		// 	},
		// },
		// {
		// 	label: 'Türkçe',
		// 	lang: 'tr',
		// 	parameters: {
		// 		tag: 'tr',
		// 	},
		// },
		// {
		// 	label: 'Русский',
		// 	lang: 'ru',
		// 	parameters: {
		// 		tag: 'ru',
		// 	},
		// },
		// {
		// 	label: 'हिंदी',
		// 	lang: 'hi',
		// 	parameters: {
		// 		tag: 'hi',
		// 	},
		// },
		// {
		// 	label: 'Dansk',
		// 	lang: 'da',
		// 	parameters: {
		// 		tag: 'da',
		// 	},
		// },
		// {
		// 	label: 'Українська',
		// 	lang: 'uk',
		// 	parameters: {
		// 		tag: 'uk',
		// 	},
		// },
	],
	files: [
		{
			include: ['src/content/docs/**/*.(md|mdx)'],
			exclude: ['src/content/docs/typedoc/**/*.(md|mdx)'],
			pattern: {
				source: 'src/content/docs/@path',
				locales: 'src/content/docs/@lang/@path',
			},
			type: 'universal',
		},
		{
			include: ['src/content/i18n/*.json'],
			pattern: 'src/content/i18n/@lang.json',
			type: 'universal',
		},
	],
	// tracking: {
	// 	localizableProperty: 'i18nReady',
	// 	ignoredKeywords: [
	// 		'lunaria-ignore',
	// 		'typo',
	// 		'en-only',
	// 		'broken link',
	// 		'i18nReady',
	// 		'i18nIgnore',
	// 	],
	// },
});
