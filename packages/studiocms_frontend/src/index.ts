import type { AstroIntegration } from 'astro';
import { name } from '../package.json';
import configSetup from './hooks/configSetup';
import type { StudioCMSFrontEndOptions } from './schema';

/**
 * StudioCMS Frontend Integration
 */
function studioCMSFrontend(options: StudioCMSFrontEndOptions): AstroIntegration {
	return {
		name,
		hooks: {
			'astro:config:setup': (params) => configSetup(params, options),
		},
	};
}

export default studioCMSFrontend;
