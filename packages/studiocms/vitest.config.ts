import studiocmsUi from '@studiocms/ui';
import { convertToSafeString, rendererComponentFilter } from '@withstudiocms/internal_helpers';
import type { AstroIntegration } from 'astro';
import { getViteConfig } from 'astro/config';
import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { defineProject } from 'vitest/config';
import { getUiOpts } from './src/consts';
import { type StudioCMSOptions, StudioCMSOptionsSchema } from './src/schemas';
import { availableTranslationFileKeys, availableTranslations } from './src/virtuals/i18n/v-files';
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
					'studiocms:i18n/virtual': `
						export const availableTranslationFileKeys = ${JSON.stringify(availableTranslationFileKeys)};
						export const availableTranslations = ${JSON.stringify(availableTranslations)};
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
			integrations: [testIntegration, studiocmsUi(getUiOpts())],
		}
	)
);
