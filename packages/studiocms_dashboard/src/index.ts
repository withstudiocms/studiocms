import type { AstroIntegration } from 'astro';
import configDone from './hooks/configDone.js';
import configSetup from './hooks/configSetup.js';
import serverStart from './hooks/serverStart.js';
import type { StudioCMSDashboardOptions } from './schema.js';
import readJson from './utils/readJson.js';

const { name } = readJson<{ name: string }>(new URL('../package.json', import.meta.url));

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
