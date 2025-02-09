import inlineMod from '@inox-tools/aik-mod';
import { runtimeLogger } from '@inox-tools/runtime-logger';
import type { StudioCMSRendererConfig } from '@studiocms/core/schemas';
import {
	addVirtualImports,
	createResolver,
	defineIntegration,
	withPlugins,
} from 'astro-integration-kit';
import { z } from 'astro/zod';
import { shared } from './lib/shared.js';
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
export const studioCMSRenderers = defineIntegration({
	name: pkgName,
	optionsSchema: z.object({
		opts: z.custom<StudioCMSRendererConfig>(),
		verbose: z.boolean(),
	}),
	setup: ({ options: { opts, verbose } }) => {
		// Resolver Function
		const { resolve } = createResolver(import.meta.url);
		const RendererComponent = resolve('../components/Renderer.js');

		// Resolve the callout theme based on the user's configuration
		const resolvedCalloutTheme = resolve(
			`./styles/md-remark-callouts/${opts.studiocms.callouts.theme}.css`
		);

		return withPlugins({
			name: pkgName,
			plugins: [inlineMod],
			hooks: {
				'astro:config:setup': (params) => {
					// Destructure the params
					const { logger, injectScript } = params;

					// Log that Setup is Starting
					integrationLogger(
						{ logger, logLevel: 'info', verbose },
						'Setting up StudioCMS Renderer...'
					);
					// Setup the runtime logger
					runtimeLogger(params, { name: 'studiocms-renderer' });

					addVirtualImports(params, {
						name: pkgName,
						imports: {
							'studiocms:renderer/config': `export default ${JSON.stringify(opts)}`,
							'studiocms:renderer': `export { default as StudioCMSRenderer } from '${RendererComponent}';`,
							'studiocms:renderer/current': `
							export * from '${resolve('./lib/contentRenderer.js')}';
								import contentRenderer from '${resolve('./lib/contentRenderer.js')}';
								export default contentRenderer;
							`,
							// Styles for the Markdown Remark processor
							'studiocms:renderer/markdown-remark/css': `
								import '${resolve('./styles/md-remark-headings.css')}';
								${opts.studiocms.callouts.enabled ? `import '${resolvedCalloutTheme}';` : ''}
							`,
						},
					});

					if (opts.renderer === 'studiocms') {
						injectScript('page-ssr', 'import "studiocms:renderer/markdown-remark/css";');
					}

					integrationLogger(
						{ logger, logLevel: 'info', verbose },
						'StudioCMS Renderer Virtual Imports Added...'
					);
				},
				'astro:config:done': ({ injectTypes, config }) => {
					// Inject Types for Renderer
					injectTypes(rendererDTS);

					// Inject Types for Renderer Config
					injectTypes(rendererConfigDTS);

					// Inject Types for Astro Markdown Config
					injectTypes(rendererMarkdownConfigDTS);

					// Inject the Markdown configuration into the shared state
					shared.markdownConfig = config.markdown;
					shared.studiocms = opts.studiocms;
				},
			},
		});
	},
});

export default studioCMSRenderers;

export type { StudioCMSRendererConfig };
