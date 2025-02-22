import starlight from '@astrojs/starlight';
import starWarp from '@inox-tools/star-warp';
import ui from '@studiocms/ui';
import { defineConfig } from 'astro/config';
import starlightImageZoom from 'starlight-image-zoom';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import getCoolifyURL from './hostUtils.ts';
import rehypePlugins from './src/plugins/rehypePluginKit.ts';
import { typeDocPlugins } from './typedoc.config.ts';

// Define the Site URL
const site = getCoolifyURL(true) || 'https://docs.studiocms.dev/';

export const locales = {
	root: { label: 'English', lang: 'en' },
	es: { label: 'Español', lang: 'es' },
	// de: { label: 'Deutsch', lang: 'de' },
	// ja: { label: '日本語', lang: 'ja' },
	// fr: { label: 'Français', lang: 'fr' },
	// it: { label: 'Italiano', lang: 'it' },
	// id: { label: 'Bahasa Indonesia', lang: 'id' },
	// 'zh-cn': { label: '简体中文', lang: 'zh-CN' },
	// 'pt-br': { label: 'Português do Brasil', lang: 'pt-BR' },
	// 'pt-pt': { label: 'Português', lang: 'pt-PT' },
	// ko: { label: '한국어', lang: 'ko' },
	// tr: { label: 'Türkçe', lang: 'tr' },
	// ru: { label: 'Русский', lang: 'ru' },
	// hi: { label: 'हिंदी', lang: 'hi' },
	// da: { label: 'Dansk', lang: 'da' },
	// uk: { label: 'Українська', lang: 'uk' },
};

export default defineConfig({
	site,
	image: {
		remotePatterns: [{ protocol: 'https' }],
	},
	markdown: {
		rehypePlugins,
	},
	integrations: [
		ui(),
		starlight({
			title: 'StudioCMS',
			description: 'A dedicated CMS for Astro DB. Built from the ground up by the Astro community.',
			favicon: '/logo-light.svg',
			lastUpdated: true,
			credits: true,
			tagline: 'A dedicated CMS for Astro DB. Built from the ground up by the Astro community.',
			disable404Route: true,
			components: {
				SiteTitle: './src/starlightOverrides/SiteTitle.astro',
				PageTitle: './src/starlightOverrides/PageTitle.astro',
				Sidebar: './src/starlightOverrides/Sidebar.astro',
				Head: './src/starlightOverrides/Head.astro',
			},
			logo: {
				dark: '../assets/logo-light.svg',
				light: '../assets/logo-dark.svg',
			},
			defaultLocale: 'root',
			locales,
			social: {
				github: 'https://github.com/withstudiocms/studiocms',
				discord: 'https://chat.studiocms.dev',
				youtube: 'https://www.youtube.com/@StudioCMS',
				'x.com': 'https://x.com/withstudiocms',
				blueSky: 'https://bsky.app/profile/studiocms.dev',
				patreon: 'https://patreon.com/StudioCMS',
			},
			customCss: [
				'@studiocms/ui/css/global.css',
				'./src/styles/sponsorcolors.css',
				'./src/styles/starlight.css',
			],
			editLink: {
				baseUrl: 'https://github.com/withstudiocms/studiocms/tree/main/docs',
			},
			head: [
				// {
				// 	tag: 'script',
				// 	attrs: {
				// 		src: 'https://analytics.studiocms.xyz/script.js',
				// 		'data-website-id': '00717cde-0d92-42be-8f49-8de0b1d810b2',
				// 		defer: true,
				// 	},
				// },
				{
					tag: 'meta',
					attrs: {
						property: 'og:image',
						content: `${site}og.jpg?v=1`,
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'twitter:image',
						content: `${site}og.jpg?v=1`,
					},
				},
			],
			plugins: [
				...typeDocPlugins,
				starlightImageZoom(),
				starWarp({
					openSearch: {
						title: 'StudioCMS Docs',
						description: 'Search StudioCMS documentation',
						enabled: true,
					},
				}),
				starlightSidebarTopics([
					{
						label: 'Learn',
						link: '/start-here/getting-started',
						icon: 'open-book',
						id: 'learn',
						items: [
							{
								label: 'Start Here',
								autogenerate: { directory: 'start-here' },
							},
							{
								label: 'Contributing Guides',
								autogenerate: { directory: 'contributing' },
							},
							{
								label: 'Understanding StudioCMS',
								autogenerate: { directory: 'how-it-works' },
							},
							{
								label: 'Plugins',
								autogenerate: { directory: 'plugins' },
							},
						],
					},
					{
						label: 'Package Catalog',
						link: '/package-catalog',
						icon: 'download',
						id: 'package-catalog',
						items: [
							{
								label: 'Catalog',
								link: '/package-catalog',
							},
							{
								label: 'StudioCMS Plugins',
								autogenerate: { directory: 'package-catalog/studiocms-plugins' },
							},
							{
								label: 'Community Plugins',
								autogenerate: { directory: 'package-catalog/community-plugins' },
							},
						],
					},
					{
						label: 'References',
						link: '/config-reference',
						icon: 'information',
						id: 'references',
						items: [
							{
								label: 'Configuration Reference',
								autogenerate: { directory: 'config-reference' },
							},
							{
								label: 'TypeDoc',
								badge: {
									text: 'Auto Generated',
									variant: 'tip',
								},
								items: [
									{
										label: 'studiocms',
										autogenerate: { directory: 'typedoc/studiocms' },
										collapsed: true,
									},
									{
										label: '@studiocms/blog',
										autogenerate: { directory: 'typedoc/studiocms-blog' },
										collapsed: true,
									},
									{
										label: '@studiocms/devapps',
										autogenerate: { directory: 'typedoc/studiocms-devapps' },
										collapsed: true,
									},
								],
							},
						],
					},
				]),
			],
		}),
	],
});
