import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import { convertHyphensToUnderscores } from '../utils/convert-hyphens';
import { integrationLogger } from '../utils/integrationLogger';

type Options = {
	verbose: boolean;
	name: string;
	ComponentRegistry: Record<string, string>;
	astroConfigResolve: (...path: Array<string>) => string;
};

export const componentRegistryHandler = defineUtility('astro:config:setup')(
	async (params, options: Options) => {
		const { logger } = params;

		const { ComponentRegistry, astroConfigResolve, verbose, name } = options;

		const logInfo = { logger, logLevel: 'info' as const, verbose };

        integrationLogger(logInfo, 'Setting up component registry...');

		const componentKeys = ComponentRegistry
			? Object.keys(ComponentRegistry).map((key) => convertHyphensToUnderscores(key.toLowerCase()))
			: [];

		const components = ComponentRegistry
			? Object.entries(ComponentRegistry)
					.map(
						([key, value]) =>
							`export { default as ${convertHyphensToUnderscores(key)} } from '${astroConfigResolve(value)}';`
					)
					.join('\n')
			: '';

		// DO more logic for the new component registry handler

		addVirtualImports(params, {
			name,
			imports: {
                // Deprecated, to be moved to the new component registry handler
				'studiocms:component-proxy': `
					export const componentKeys = ${JSON.stringify(componentKeys || [])};
					${components}
				`,

                // New component registry handler
                'studiocms:component-registry': `
                    export const componentKeys = ${JSON.stringify(componentKeys || [])};
					${components}
                `
			},
		});
	}
);
