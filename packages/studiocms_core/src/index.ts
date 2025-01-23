import type { AstroIntegration } from 'astro';
// import { name as pkgName } from '../package.json' assert { type: 'json' };
import configDone from './hooks/config-done.js';
import configSetup from './hooks/config-setup.js';
import type { StudioCMSConfig } from './schemas/index.js';
import readJson from './utils/readJson.js';

const { name: pkgName } = readJson<{ name: string }>(new URL('../package.json', import.meta.url));

/**
 * **StudioCMS Core Integration**
 *
 * @param options StudioCMS Configuration
 * @returns AstroIntegration
 *
 * @see [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 */
export function studioCMSCore(options: StudioCMSConfig): AstroIntegration {
	return {
		name: pkgName,
		hooks: {
			'astro:config:setup': (params) => configSetup(params, options),
			'astro:config:done': (params) => configDone(params),
		},
	};
}

export default studioCMSCore;
