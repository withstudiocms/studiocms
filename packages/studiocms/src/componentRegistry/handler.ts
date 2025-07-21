import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import { Effect, convertToVanilla, genLogger } from '../effect.js';
import { integrationLogger } from '../utils/integrationLogger.js';
import { ComponentRegistry } from './Registry.js';
import { convertHyphensToUnderscores } from './convert-hyphens.js';
import type { AstroComponentProps, ComponentRegistryEntry } from './types.js';

type componentRegistryHandlerOptions = {
	verbose: boolean;
	name: string;
	componentRegistry: Record<string, string> | undefined;
};

export const componentRegistryHandler = defineUtility('astro:config:setup')(
	async (params, { componentRegistry, verbose, name }: componentRegistryHandlerOptions) =>
		await convertToVanilla(
			genLogger('studiocms/componentRegistry/handler')(function* () {
				// Setup helpers
				const logInfo = { logger: params.logger, logLevel: 'info' as const, verbose };
				const { resolve } = createResolver(import.meta.url);
				const { resolve: astroConfigResolve } = createResolver(params.config.root.pathname);

				// Log the start of the component registry setup
				integrationLogger(logInfo, 'Setting up component registry...');

				// Get the Registry instance
				const registry = yield* ComponentRegistry;

				// Setup Components and Component Keys Arrays
				const componentKeys: string[] = [];
				const components: string[] = [];

				// Get the component registry from the params or use an empty object
				const componentRegistryToCheck = componentRegistry || {};
				const componentRegistryEntries = Object.entries(componentRegistryToCheck);

				if (Object.keys(componentRegistryToCheck).length === 0) {
					integrationLogger(logInfo, 'No components found in the registry, skipping...');
				} else {
					// Log the number of components to check
					integrationLogger(
						logInfo,
						`Checking ${Object.keys(componentRegistryToCheck).length} components...`
					);

					// Iterate over the component registry entries
					integrationLogger(logInfo, 'Iterating over component registry entries...');
					for (const [key, value] of componentRegistryEntries) {
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
							integrationLogger(
								logInfo,
								`Component "${key}" does not end with .astro, skipping...`
							);
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

						const keyName = key.toLowerCase();
						const safeKeyName = convertHyphensToUnderscores(keyName);

						// Add the component key and import statement
						componentKeys.push(safeKeyName);
						components.push(`export { default as ${safeKeyName} } from '${resolvedPath}';`);

						// Register the component in the registry
						yield* registry.registerComponentFromFile(resolvedPath, keyName);
					}
				}

				integrationLogger(logInfo, `Total components found: ${componentKeys.length}`);

				integrationLogger(logInfo, 'Extracting component props...');
				const componentPropsMap: Map<string, AstroComponentProps> =
					yield* registry.getAllComponents();

				const componentPropsEntries = Array.from(componentPropsMap.entries());

				const componentProps: ComponentRegistryEntry[] = componentPropsEntries.map(
					([iName, data]) => ({
						...data,
						name: iName,
						safeName: convertHyphensToUnderscores(iName),
					})
				);

				integrationLogger(logInfo, `Total component props extracted: ${componentProps.length}`);

				integrationLogger(logInfo, 'Component registry setup complete.');

				integrationLogger(
					logInfo,
					`Registered components:\n${JSON.stringify(componentProps, null, 2)}`
				);

				addVirtualImports(params, {
					name,
					imports: {
						'studiocms:component-registry': `
							export const componentKeys = ${JSON.stringify(componentKeys || [])};
							export const componentProps = ${JSON.stringify(componentProps || [])};
							${components ? components.join('\n') : ''}
						`,
						'studiocms:component-registry/runtime': `
							export * from '${resolve('./runtime.js')}';
						`,
					},
				});
			}).pipe(Effect.provide(ComponentRegistry.Default))
		)
);
