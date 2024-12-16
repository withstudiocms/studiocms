import type { AstroIntegration } from 'astro';
import { name as pkgName } from '../package.json';
import configDone from './hooks/configDone';
import configSetup from './hooks/configSetup';
import type { StudioCMSImageHandlerOptions } from './schema';

/**
 * StudioCMS Image Handler Integration
 */
function studioCMSImageHandler(options: StudioCMSImageHandlerOptions): AstroIntegration {
	// Define the Image Component Path
	let imageComponentPath: string;

	return {
		name: pkgName,
		hooks: {
			'astro:config:setup': (params) => {
				imageComponentPath = configSetup(params, pkgName, options);
			},
			'astro:config:done': (params) => configDone(params, imageComponentPath),
		},
	};
}

export default studioCMSImageHandler;
