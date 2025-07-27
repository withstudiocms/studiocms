import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import { Effect, convertToVanilla, genLogger } from '../effect.js';
import { integrationLogger } from '../utils/integrationLogger.js';
import { ComponentRegistry } from './Registry.js';
import { convertHyphensToUnderscores } from './convert-hyphens.js';
import type { AstroComponentProps, ComponentRegistryEntry } from './types.js';

/**
 * Options for the component registry handler.
 *
 * @property verbose - Enables verbose logging when set to true.
 * @property name - The name associated with the registry handler.
 * @property componentRegistry - An optional record mapping component names to their string identifiers.
 */
type componentRegistryHandlerOptions = {
	verbose: boolean;
	name: string;
	componentRegistry: Record<string, string> | undefined;
	builtInComponents?: Record<string, string>;
};

/**
 * Handles the setup and registration of components in the StudioCMS component registry during the Astro config setup phase.
 *
 * This utility:
 * - Logs the start and progress of the registry setup.
 * - Iterates over the provided component registry, validating and resolving component paths.
 * - Registers valid `.astro` components in the registry.
 * - Extracts and maps component props for all registered components.
 * - Adds virtual imports for component keys, props, and runtime exports.
 *
 * @param params - The Astro integration setup parameters, including logger and config.
 * @param options - Options for the handler, including the component registry, verbosity, and registry name.
 * @returns An asynchronous effect that sets up the component registry and provides virtual imports for use in the project.
 *
 * @remarks
 * - Only components with string values ending in `.astro` are registered.
 * - Component keys are normalized to lowercase and hyphens are converted to underscores for safe usage.
 * - Virtual imports are added for both the registry and its runtime.
 */
export const componentRegistryHandler = defineUtility('astro:config:setup')(
	async (
		params,
		{ componentRegistry, builtInComponents, verbose, name }: componentRegistryHandlerOptions
	) =>
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

				// merge built-in components with the provided user component registry
				const componentRegistryToCheck: Record<string, string> = {
					...builtInComponents,
					...componentRegistry,
				};

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

						let resolvedPath: string;
						try {
							resolvedPath = astroConfigResolve(value);
						} catch (error) {
							integrationLogger(logInfo, `Failed to resolve path for component "${key}": ${error}`);
							continue;
						}

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

				if (verbose && componentProps.length <= 10) {
					integrationLogger(
						logInfo,
						`Registered components:\n${JSON.stringify(componentProps, null, 2)}`
					);
				} else {
					integrationLogger(
						logInfo,
						`Registered ${componentProps.length} components. Use verbose mode with fewer components to see details.`
					);
				}

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
