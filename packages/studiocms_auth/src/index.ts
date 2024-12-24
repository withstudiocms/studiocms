import type { AstroIntegration } from 'astro';
import { name } from '../package.json';
import configDone from './hooks/config-done';
import configSetup from './hooks/config-setup';
import type { StudioCMSAuthOptions } from './schema';

/**
 * StudioCMS Auth Integration
 */
function studioCMSAuth(options: StudioCMSAuthOptions, prerenderRoutes: boolean): AstroIntegration {
	return {
		name,
		hooks: {
			'astro:config:setup': (params) => configSetup(params, name, options, prerenderRoutes),
			'astro:config:done': (params) => configDone(params),
		},
	};
}

export default studioCMSAuth;
