import { runtimeLogger } from '@inox-tools/runtime-logger';
import { stringify } from '@studiocms/core/lib';
import { StudioCMSRendererConfigSchema } from '@studiocms/core/schemas/renderer';
import { addVirtualImports, createResolver, defineIntegration } from 'astro-integration-kit';
import { name } from '../package.json';
import { rendererDTS } from './stubs/renderer';
import { rendererConfigDTS } from './stubs/renderer-config';
import { rendererAstroMarkdownDTS } from './stubs/renderer-markdownConfig';

/**
 * StudioCMS Renderers Integration
 */
export default defineIntegration({
	name,
	optionsSchema: StudioCMSRendererConfigSchema,
	setup({ name, options }) {
		// Create resolver relative to this file
		const { resolve } = createResolver(import.meta.url);

		// Import the Renderer Component
		const RendererComponent = resolve('./components/StudioCMSRenderer.astro');

		return {
			hooks: {
				'astro:config:setup': (params) => {
					// Destructure the params
					const {
						config: { markdown: astroMarkdown },
					} = params;

					// Setup the runtime logger
					runtimeLogger(params, { name: 'studiocms-renderer' });

					// Add Virtual Imports
					addVirtualImports(params, {
						name,
						imports: {
							'studiocms:renderer': `export { default as StudioCMSRenderer } from '${RendererComponent}';`,
							'studiocms:renderer/config': `export default ${stringify(options)}`,
							'studiocms:renderer/astroMarkdownConfig': `export default ${stringify(astroMarkdown)}`,
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
	},
});
