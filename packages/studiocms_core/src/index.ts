import type { AstroIntegration } from 'astro';
import { name as pkgName } from '../package.json';
import configDone from './hooks/config-done';
import configSetup from './hooks/config-setup';
import type { StudioCMSConfig } from './schemas';

/**
 * **StudioCMS Core Integration**
 *
 * @param options StudioCMS Configuration
 * @returns AstroIntegration
 *
 * @see [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 */
export function studioCMSCore(
	options: StudioCMSConfig,
	prerenderRoutes: boolean
): AstroIntegration {
	return {
		name: pkgName,
		hooks: {
			'astro:config:setup': (params) => configSetup(params, options, prerenderRoutes),
			'astro:config:done': (params) => configDone(params),
		},
	};
}

export default studioCMSCore;
