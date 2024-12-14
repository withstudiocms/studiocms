import starlight from '@astrojs/starlight';
import starlightUtils from '@lorenzo_lewis/starlight-utils';
import { defineConfig } from 'astro/config';
import starlightImageZoom from 'starlight-image-zoom';
import getCoolifyURL from './hostUtils.ts';
import rehypePluginKit from './src/plugins/rehypePluginKit.ts';
import { typeDocPlugins, typeDocSideBarEntry } from './typedoc.config.ts';

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
		rehypePlugins: rehypePluginKit,
	},
	integrations: [
		starlight({
			title: 'StudioCMS',
			description: 'A dedicated CMS for Astro DB. Built from the ground up by the Astro community.',
			favicon: '/logo-light.svg',
			lastUpdated: true,
			credits: true,
			tagline: 'A dedicated CMS for Astro DB. Built from the ground up by the Astro community.',
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
			sidebar: [
				{
					label: 'Learn',
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
							label: 'Package Catalog',
							items: [
								{
									label: 'Package List',
									link: '/package-catalog',
									badge: { text: 'New', variant: 'success' },
								},
								{
									label: 'StudioCMS Integrations',
									autogenerate: { directory: 'package-catalog/studiocms-integrations' },
									collapsed: true,
								},
								{
									label: 'Community Integrations',
									autogenerate: { directory: 'package-catalog/community-integrations' },
									collapsed: true,
								},
							],
						},
						{
							label: 'Customizing StudioCMS',
							items: [
								{
									label: '@studiocms/renderers',
									autogenerate: { directory: 'customizing/studiocms-renderers' },
									collapsed: true,
								},
							],
						},
					],
				},
				{
					label: 'References',
					items: [
						{
							label: 'Configuration Reference',
							autogenerate: { directory: 'config-reference' },
							collapsed: false,
						},
						typeDocSideBarEntry,
					],
				},
			],
			plugins: [
				starlightUtils({
					multiSidebar: { switcherStyle: 'horizontalList' },
				}),
				...typeDocPlugins,
				starlightImageZoom(),
			],
		}),
	],
});
