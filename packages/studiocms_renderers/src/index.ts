import type { StudioCMSRendererConfig } from '@studiocms/core/schemas/renderer';
import type { AstroIntegration } from 'astro';
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
	verbose?: boolean
): AstroIntegration {
	return {
		name: pkgName,
		hooks: {
			'astro:config:setup': (params) => configSetup(params, { options, verbose, pkgName }),
			'astro:config:done': (params) => configDone(params),
		},
	};
}

export default studioCMSRenderers;

export type { StudioCMSRendererConfig };
