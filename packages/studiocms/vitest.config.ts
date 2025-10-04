import { icons as circleFlags } from '@iconify-json/circle-flags';
import { icons as flatColorIcons } from '@iconify-json/flat-color-icons';
import { icons as simpleIcons } from '@iconify-json/simple-icons';
import studiocmsUi from '@studiocms/ui';
import { convertToSafeString, rendererComponentFilter } from '@withstudiocms/internal_helpers';
import type { AstroIntegration } from 'astro';
import { getViteConfig } from 'astro/config';
import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { defineProject } from 'vitest/config';
import { type StudioCMSOptions, StudioCMSOptionsSchema } from './src/schemas/config/index.js';
import {
	availableTranslationFileKeys,
	availableTranslations,
	currentFlags,
} from './src/virtuals/i18n/v-files';
import { buildVirtualConfig } from './src/virtuals/utils';

const { resolve } = createResolver(import.meta.url);

const CMSConfig: StudioCMSOptions = {
	dbStartPage: false,
};

const testConfig = StudioCMSOptionsSchema.parse(CMSConfig);

const pluginRenderers: {
	pageType: string;
	safePageType: string;
	content: string;
}[] = [
	{
		pageType: 'mock/render',
		safePageType: convertToSafeString('mock/render'),
		content: rendererComponentFilter(
			resolve('./test/fixtures/renderer.astro'),
			convertToSafeString('mock/render')
		),
	},
];

const testIntegration: AstroIntegration = {
	name: 'test-integration',
	hooks: {
		'astro:config:setup': (params) => {
			addVirtualImports(params, {
				name: 'test-integration',
				imports: {
					'studiocms:logger': `
						export const logger = console;
						export default logger;
					`,
					'studiocms:version': `export default '0.0.0-test';`,
					'studiocms:i18n': `export * from '${resolve('./src/virtuals/i18n/server.ts')}';`,
					'studiocms:i18n/client': `export * from '${resolve('./src/virtuals/i18n/client.ts')}';`,
					'studiocms:i18n/virtual': `
						export const availableTranslationFileKeys = ${JSON.stringify(availableTranslationFileKeys)};
						export const availableTranslations = ${JSON.stringify(availableTranslations)};
						export const currentFlags = ${JSON.stringify(currentFlags)};
					`,
					'studiocms:config': buildVirtualConfig(testConfig),
					'studiocms:plugins/imageService': `export const imageServiceKeys = ${JSON.stringify([])}`,
					'virtual:studiocms/plugins/renderers': `${pluginRenderers ? pluginRenderers.map(({ content }) => content).join('\n') : ''}`,
					'studiocms:plugins/renderers': `export const pluginRenderers = ${JSON.stringify(pluginRenderers.map(({ pageType, safePageType }) => ({ pageType, safePageType })) || [])};`,
					'studiocms:component-registry/runtime':
						// Test-only identity renderer: mirrors API shape but skips sanitization on purpose.
						'export const createRenderer = (result, sanitize, preRenderer) => (content) => content;',
					// NOT A REAL KEY, this is the same key used by the CLI when no user-key is provided
					'virtual:studiocms/sdk/env': `export const cmsEncryptionKey = '+URKVIiIM1kmG6g9Znb10g==';`,
					'studiocms:auth/scripts/three': `export const hello = 'world';`,
					'studiocms:auth/utils/validImages': `export * from '${resolve('./src/virtuals/auth/validImages/index.ts')}';`,
					'studiocms:lib': `export * from '${resolve('./src/virtuals/lib/routeMap.ts')}';`,
					'studiocms:plugins/auth/providers': `export const oAuthButtons = ${JSON.stringify([
						{
							enabled: true,
							safeName: 'github',
							label: 'GitHub',
							image: 'github.png',
						},
						{
							enabled: false,
							safeName: 'discord',
							label: 'Discord',
							image: 'discord.png',
						},
					])};`,
					'virtual:studiocms/sitemaps': `export const sitemaps = ['./sitemap-blog.xml', './sitemap-shop.xml'];`,
					'studiocms:components': `export { default as Generator } from '${resolve('./test/fixtures/Generator.astro')}';`,
				},
			});
		},
	},
};

export default defineProject(
	getViteConfig(
		{
			test: {
				environment: 'node',
				include: ['**/*.test.ts'],
			},
		},
		{
			integrations: [
				testIntegration,
				studiocmsUi({
					noInjectCSS: true,
					icons: {
						flatcoloricons: flatColorIcons,
						simpleicons: simpleIcons,
						'lang-flags': circleFlags,
					},
				}),
			],
		}
	)
);
