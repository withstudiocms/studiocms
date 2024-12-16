import type { AstroIntegration } from 'astro';
import { name } from '../package.json';
import configDone from './hooks/configDone';
import configSetup from './hooks/configSetup';
import serverStart from './hooks/serverStart';
import type { StudioCMSDashboardOptions } from './schema';

/**
 * StudioCMS Dashboard Integration
 */
function studioCMSDashboard(options: StudioCMSDashboardOptions): AstroIntegration {
	return {
		name,
		hooks: {
			'astro:config:setup': (params) => configSetup(params, name, options),
			'astro:config:done': (params) => configDone(params),
			'astro:server:start': (params) => serverStart(params, options),
		},
	};
}

export default studioCMSDashboard;
