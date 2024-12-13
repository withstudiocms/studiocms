import { runtimeLogger } from '@inox-tools/runtime-logger';
import { stringify } from '@studiocms/core/lib';
import type { StudioCMSRendererConfig } from '@studiocms/core/schemas/renderer';
import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver } from 'astro-integration-kit';
import { name as pkgName } from '../package.json';
import { rendererDTS } from './stubs/renderer';
import { rendererConfigDTS } from './stubs/renderer-config';
import { rendererAstroMarkdownDTS } from './stubs/renderer-markdownConfig';

/**
 * **StudioCMS Renderers Integration**
 *
 * @param options StudioCMS Renderer Configuration
 * @returns AstroIntegration
 *
 * @see [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 */
export function studioCMSRenderers(options: StudioCMSRendererConfig): AstroIntegration {
	// Create resolver relative to this file
	const { resolve } = createResolver(import.meta.url);

	// Import the Renderer Component
	const RendererComponent = resolve('./components/StudioCMSRenderer.astro');
	return {
		name: pkgName,
		hooks: {
			'astro:config:setup': (params) => {
				// Setup the runtime logger
				runtimeLogger(params, { name: 'studiocms-renderer' });

				// Add Virtual Imports
				addVirtualImports(params, {
					name: pkgName,
					imports: {
						'studiocms:renderer': `export { default as StudioCMSRenderer } from '${RendererComponent}';`,
						'studiocms:renderer/config': `export default ${stringify(options)}`,
						'studiocms:renderer/astroMarkdownConfig': `export default ${stringify(params.config.markdown)}`,
					},
				});
			},
			'astro:config:done': ({ injectTypes }) => {
				// Inject Types for Renderer
				injectTypes(rendererDTS(RendererComponent));

				// Inject Types for Renderer Config
				injectTypes(rendererConfigDTS());

				// Inject Types for Astro Markdown Config
				injectTypes(rendererAstroMarkdownDTS());
			},
		},
	};
}

export default studioCMSRenderers;

export type { StudioCMSRendererConfig };
