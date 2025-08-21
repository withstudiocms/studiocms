/// <reference types="../virtual.d.ts" preserve="true" />

import { deepmerge, Effect, runEffect } from '@withstudiocms/effect';
import { z } from 'astro/zod';
import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import type { ComponentRegistryEntry } from '../types.js';
import { convertHyphensToUnderscores, integrationLogger } from '../utils.js';
import { buildAliasExports, buildVirtualImport, InternalId, RuntimeInternalId } from './consts.js';
import { ComponentRegistry } from './Registry.js';

export const ComponentRegistryHandlerOptionSchema = z.object({
	config: z.object({
		/**
		 * The name of the integration
		 */
		name: z.string(),

		/**
		 * The virtual module ID for generated imports
		 *
		 * @example 'virtual:my-integration'
		 */
		virtualId: z.string().optional(),

		/**
		 * Enables verbose logging
		 */
		verbose: z.boolean().default(false).optional(),
	}),

	/**
	 * A record of user-provided component names to file paths.
	 */
	componentRegistry: z.record(z.string(), z.string()).optional(),

	/**
	 * A record of built-in component names to file paths.
	 */
	builtInComponents: z.record(z.string(), z.string()).optional(),
});

export type ComponentRegistryHandlerOptions = z.infer<typeof ComponentRegistryHandlerOptionSchema>;

/**
 * Creates an Effect-based resolver function for resolving component paths.
 *
 * @param base - The base path used to initialize the resolver.
 * @returns An Effect-wrapped function that accepts a callback. The callback receives a `resolve` function,
 * which can be used to resolve component paths relative to the base. If an error occurs during resolution,
 * it is caught, logged to the console, and an Error object is returned with the original error as its cause.
 *
 * @example
 * const resolveEffect = resolver('/components');
 * const result = yield* resolveEffect((resolve) => resolve('Button'));
 */
const resolver = Effect.fn(function* (base: string) {
	const { resolve: _resolve } = createResolver(base);
	return Effect.fn((fn: (resolve: (...path: Array<string>) => string) => string) =>
		Effect.try({
			try: () => fn(_resolve),
			catch: (error) => {
				console.error('Error occurred while resolving component:', error);
				return new Error('Failed to resolve component', { cause: error });
			},
		})
	);
});

/**
 * Handles the setup and registration of components in the component registry during the Astro config setup phase.
 *
 * This utility merges built-in and user-provided component registries, validates and resolves component paths,
 * registers components, and generates virtual imports for use at runtime. It also logs detailed information
 * about the registration process, including the number of components processed and their properties.
 *
 * @remarks
 * - Only components with string values ending in `.astro` are considered valid.
 * - Uses Effect for error handling and asynchronous operations.
 * - Generates virtual modules for internal proxying and runtime usage.
 *
 * @param params - The parameters provided by the Astro utility hook, including logger and config.
 * @param options - An object containing configuration and registry options:
 *   - `config.verbose` - Enables verbose logging if true.
 *   - `config.name` - The name of the integration for logging purposes.
 *   - `config.virtualId` - The virtual module ID for generated imports.
 *   - `builtInComponents` - A record of built-in component names to file paths.
 *   - `componentRegistry` - A record of user-provided component names to file paths.
 * @returns A promise that resolves after the component registry has been set up and virtual imports have been added.
 *
 * @example
 * ```typescript
 * await componentRegistryHandler(params, {
 *   config: { verbose: true, name: 'my-integration', virtualId: 'virtual:my-registry' },
 *   builtInComponents: { button: '/components/Button.astro' },
 *   componentRegistry: { card: '/components/Card.astro' }
 * });
 * ```
 */
export const componentRegistryHandler = defineUtility('astro:config:setup')(
	async (
		params,
		{
			config: { verbose = false, name, virtualId },
			builtInComponents = {},
			componentRegistry = {},
		}: ComponentRegistryHandlerOptions
	) =>
		await runEffect(
			Effect.gen(function* () {
				const logger = params.logger.fork(`${name}:component-registry`);
				const logInfo = { logger, logLevel: 'info' as const, verbose };

				// Log the start of the component registry setup
				integrationLogger(logInfo, 'Setting up component registry...');

				const [resolve, astroConfigResolve, registry] = yield* Effect.all([
					resolver(import.meta.url),
					resolver(params.config.root.pathname),
					ComponentRegistry,
				]);

				// Setup Components and Component Keys Arrays
				const componentKeys: string[] = [];
				const components: string[] = [];

				// merge built-in components with the provided user component registry
				const componentRegistryToCheck: Record<string, string> = yield* deepmerge((fn) =>
					fn({}, builtInComponents, componentRegistry)
				);

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

						// Use Effect's error handling instead of try/catch
						const resolvedPath = yield* astroConfigResolve((fn) => fn(value)).pipe(
							Effect.catchAll((error) => {
								integrationLogger(
									logInfo,
									`Failed to resolve path for component "${key}": ${error}`
								);
								return Effect.succeed(null); // Return null to indicate failure
							})
						);

						// Check if the resolved path is empty
						if (!resolvedPath) {
							integrationLogger(logInfo, `Component "${key}" resolved path is empty, skipping...`);
							continue;
						}

						integrationLogger(logInfo, `Component "${key}" resolved path: "${resolvedPath}"`);

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

				const componentProps: ComponentRegistryEntry[] = yield* registry.getAllComponents().pipe(
					Effect.map((map) => map.entries().toArray()),
					Effect.map((array) =>
						array.map(([iName, data]) => ({
							...data,
							name: iName,
							safeName: convertHyphensToUnderscores(iName),
						}))
					)
				);

				integrationLogger(logInfo, `Total component props extracted: ${componentProps.length}`);

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

				const virtualRuntimeImport = yield* resolve((fn) => fn('../runtime.js'));

				addVirtualImports(params, {
					name,
					imports: {
						[InternalId]: buildVirtualImport(componentKeys, componentProps, components),
						[RuntimeInternalId]: `export * from '${virtualRuntimeImport}';`,
						...(virtualId ? buildAliasExports(virtualId) : {}),
					},
				});

				integrationLogger(logInfo, 'Component registry setup complete.');
			}).pipe(Effect.provide(ComponentRegistry.Default))
		)
);
