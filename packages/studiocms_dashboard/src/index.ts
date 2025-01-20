import type { AstroIntegration } from 'astro';
import { name } from '../package.json' assert { type: 'json' };
import configDone from './hooks/configDone.js';
import configSetup from './hooks/configSetup.js';
import serverStart from './hooks/serverStart.js';
import type { StudioCMSDashboardOptions } from './schema.js';

/**
 * StudioCMS Dashboard Integration
 */
function studioCMSDashboard(
	options: StudioCMSDashboardOptions,
	prerenderRoutes: boolean
): AstroIntegration {
	return {
		name,
		hooks: {
			'astro:config:setup': (params) => configSetup(params, name, options, prerenderRoutes),
			'astro:config:done': (params) => configDone(params),
			'astro:server:start': (params) => serverStart(params, options),
		},
	};
}

export default studioCMSDashboard;
