import type { AstroIntegration } from 'astro';
import configSetup from './hooks/config-setup.js';
import type { StudioCMSAuthOptions } from './schema.js';
import authLibDTS from './stubs/auth-lib.js';
import authScriptsDTS from './stubs/auth-scripts.js';
import authUtilsDTS from './stubs/auth-utils.js';
import readJson from './utils/readJson.js';

const { name } = readJson<{ name: string }>(new URL('../package.json', import.meta.url));

/**
 * StudioCMS Auth Integration
 */
function studioCMSAuth(options: StudioCMSAuthOptions, prerenderRoutes: boolean): AstroIntegration {
	return {
		name,
		hooks: {
			'astro:config:setup': (params) => configSetup(params, name, options, prerenderRoutes),
			'astro:config:done': ({ injectTypes }) => {
				// Inject Types
				injectTypes(authLibDTS);
				injectTypes(authUtilsDTS);
				injectTypes(authScriptsDTS);
			},
		},
	};
}

export default studioCMSAuth;
