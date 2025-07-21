import { addVirtualImports, defineUtility } from 'astro-integration-kit';
import { Effect } from 'effect';
import { convertHyphensToUnderscores } from '../utils/convert-hyphens';
import { integrationLogger } from '../utils/integrationLogger';
import { ComponentRegistry } from './Registry.js';
import type { AstroComponentProps } from './types.js';

type Options = {
	verbose: boolean;
	name: string;
	componentRegistry: Record<string, string>;
	astroConfigResolve: (...path: Array<string>) => string;
};

export const componentRegistryHandler = defineUtility('astro:config:setup')(
	async (params, options: Options) => {
		const { logger } = params;

		const { componentRegistry, astroConfigResolve, verbose, name } = options;

		const logInfo = { logger, logLevel: 'info' as const, verbose };

		integrationLogger(logInfo, 'Setting up component registry...');

		const componentKeys: string[] = [];
		const components: string[] = [];

		const registry = await Effect.runPromise(
			Effect.gen(function* () {
				const { _tag, ...rest } = yield* ComponentRegistry;
				return rest;
			}).pipe(Effect.provide(ComponentRegistry.Default))
		);

		for (const [key, value] of Object.entries(componentRegistry)) {
			// Log the component key and value
			integrationLogger(logInfo, `Component "${key}" resolved to "${value}"`);

			// Check if the value is defined and is a string ending with .astro
			if (!value) {
				integrationLogger(logInfo, `Component "${key}" is not defined, skipping...`);
				continue;
			}

			if (typeof value !== 'string') {
				integrationLogger(logInfo, `Component "${key}" is not a string, skipping...`);
				continue;
			}

			if (!value.endsWith('.astro')) {
				integrationLogger(logInfo, `Component "${key}" does not end with .astro, skipping...`);
				continue;
			}

			// Resolve the path using astroConfigResolve
			integrationLogger(logInfo, `Resolving path for component "${key}"...`);

			const resolvedPath = astroConfigResolve(value);

			integrationLogger(logInfo, `Component "${key}" resolved path: "${resolvedPath}"`);

			// Check if the resolved path is empty
			if (!resolvedPath) {
				integrationLogger(logInfo, `Component "${key}" resolved path is empty, skipping...`);
				continue;
			}

			integrationLogger(logInfo, `Component "${key}" is valid and will be included.`);

			// Add the component key and import statement
			componentKeys.push(convertHyphensToUnderscores(key.toLowerCase()));
			components.push(
				`export { default as ${convertHyphensToUnderscores(key)} } from '${resolvedPath}';`
			);

			// Register the component in the registry
			await Effect.runPromise(registry.registerComponentFromFile(resolvedPath, key.toLowerCase()));
		}

		integrationLogger(logInfo, `Total components found: ${componentKeys.length}`);

		// DO more logic for the new component registry handler

		integrationLogger(logInfo, 'Extracting component props...');
		const componentPropsMap: Map<string, AstroComponentProps> = await Effect.runPromise(
			registry.getAllComponents()
		);

		const componentProps: AstroComponentProps[] = Array.from(componentPropsMap.entries()).map(
			([key, value]) => ({
				name: key,
				props: value.props,
			})
		);

		addVirtualImports(params, {
			name,
			imports: {
				// Deprecated, to be moved to the new component registry handler
				'studiocms:component-proxy': `
					export const componentKeys = ${JSON.stringify(componentKeys || [])};
					${components.join('\n')}
				`,

				// New component registry handler
				'studiocms:component-registry': `
                    export const componentKeys = ${JSON.stringify(componentKeys || [])};
                    export const componentProps = ${JSON.stringify(componentProps) || []};
					${components.join('\n')}
                `,
			},
		});
	}
);
