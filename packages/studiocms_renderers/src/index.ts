import { runtimeLogger } from '@inox-tools/runtime-logger';
import type { StudioCMSRendererConfig } from '@studiocms/core/schemas';
import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver } from 'astro-integration-kit';
import rendererConfigDTS from './stubs/renderer-config.js';
import rendererMarkdownConfigDTS from './stubs/renderer-markdownConfig.js';
import rendererDTS from './stubs/renderer.js';
import { integrationLogger } from './utils/integrationLogger.js';
import readJson from './utils/readJson.js';

const { name: pkgName } = readJson<{ name: string }>(new URL('../package.json', import.meta.url));

/**
 * **StudioCMS Renderers Integration**
 *
 * @param options StudioCMS Renderer Configuration
 * @returns AstroIntegration
 *
 * @see [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 */
export function studioCMSRenderers(
	options: StudioCMSRendererConfig,
	verbose?: boolean
): AstroIntegration {
	const { resolve } = createResolver(import.meta.url);
	const RendererComponent = resolve('../components/Renderer.js');

	return {
		name: pkgName,
		hooks: {
			'astro:config:setup': (params) => {
				// Destructure the params
				const { logger, config } = params;

				// Log that Setup is Starting
				integrationLogger(
					{ logger, logLevel: 'info', verbose },
					'Setting up StudioCMS Renderer...'
				);
				// Setup the runtime logger
				runtimeLogger(params, { name: 'studiocms-renderer' });

				// Add Virtual Imports
				addVirtualImports(params, {
					name: pkgName,
					imports: {
						'studiocms:renderer': `export { default as StudioCMSRenderer } from '${RendererComponent}';`,
						'studiocms:renderer/config': `export default ${JSON.stringify(options)}`,
						'studiocms:renderer/astroMarkdownConfig': `export default ${JSON.stringify(config.markdown)}`,
						'studiocms:renderer/current': `
						export * from '${resolve('./lib/contentRenderer.js')}';
						import contentRenderer from '${resolve('./lib/contentRenderer.js')}';
						export default contentRenderer;
						`,
					},
				});
				integrationLogger(
					{ logger, logLevel: 'info', verbose },
					'StudioCMS Renderer Virtual Imports Added...'
				);
			},
			'astro:config:done': ({ injectTypes }) => {
				// Inject Types for Renderer
				injectTypes(rendererDTS);

				// Inject Types for Renderer Config
				injectTypes(rendererConfigDTS);

				// Inject Types for Astro Markdown Config
				injectTypes(rendererMarkdownConfigDTS);
			},
		},
	};
}

export default studioCMSRenderers;

export type { StudioCMSRendererConfig };
