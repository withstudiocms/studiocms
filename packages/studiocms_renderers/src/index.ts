import type { StudioCMSRendererConfig } from '@studiocms/core/schemas/renderer';
import type { AstroIntegration } from 'astro';
import { createResolver } from 'astro-integration-kit';
import { name as pkgName } from '../package.json';
import configDone from './hooks/config-done';
import configSetup from './hooks/config-setup';

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
	verbose: boolean
): AstroIntegration {
	// Create resolver relative to this file
	const { resolve } = createResolver(import.meta.url);

	// Import the Renderer Component
	const RendererComponent = resolve('./components/StudioCMSRenderer.astro');
	return {
		name: pkgName,
		hooks: {
			'astro:config:setup': (params) =>
				configSetup(params, { options, verbose, RendererComponent, pkgName }),
			'astro:config:done': (params) => configDone(params, RendererComponent),
		},
	};
}

export default studioCMSRenderers;

export type { StudioCMSRendererConfig };
