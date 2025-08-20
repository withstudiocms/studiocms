/// <reference types="../virtual.d.ts" preserve="true" />

import { Effect, runEffect } from '@withstudiocms/effect';
import { z } from 'astro/zod';
import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import type { AstroComponentProps, ComponentRegistryEntry } from '../types.js';
import { convertHyphensToUnderscores, integrationLogger } from '../utils.js';
import { ComponentRegistry } from './Registry.js';

export const ComponentRegistryHandlerOptionSchema = z.object({
	config: z.object({
		name: z.string(),
		virtualId: z.string(),
		verbose: z.boolean().default(false).optional(),
	}),
	componentRegistry: z.record(z.string(), z.string()).optional(),
	builtInComponents: z.record(z.string(), z.string()).optional(),
});

export type ComponentRegistryHandlerOptions = z.infer<typeof ComponentRegistryHandlerOptionSchema>;

const resolver = Effect.fn(
	(
		fn: (
			resolve: (_base: string) => {
				resolve: (...path: Array<string>) => string;
			}
		) => { resolve: (...path: string[]) => string }
	) =>
		Effect.try({
			try: () => fn(createResolver),
			catch: (error) => {
				console.error('Error occurred while resolving component:', error);
				return new Error('Failed to resolve component', { cause: error });
			},
		})
);

export const componentRegistryHandler = defineUtility('astro:config:setup')(
	async (
		params,
		{
			config: { verbose, name, virtualId },
			builtInComponents,
			componentRegistry,
		}: ComponentRegistryHandlerOptions
	) =>
		await runEffect(
			Effect.gen(function* () {
				const logger = params.logger.fork(name);
				const logInfo = { logger, logLevel: 'info' as const, verbose };
				const { resolve } = yield* resolver((res) => res(import.meta.url));
				const { resolve: astroConfigResolve } = yield* resolver((res) =>
					res(params.config.root.pathname)
				);

				// Log the start of the component registry setup
				integrationLogger(logInfo, 'Setting up component registry...');

				// Get the Registry instance
				const registry = yield* ComponentRegistry;

				// Setup Components and Component Keys Arrays
				const componentKeys: string[] = [];
				const components: string[] = [];

				// merge built-in components with the provided user component registry
				const componentRegistryToCheck: Record<string, string> = {
					...(builtInComponents ?? {}),
					...(componentRegistry ?? {}),
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

				const virtualRuntimeId = `${virtualId}/runtime`;

				const virtualImports = {
					'virtual:component-registry-internal-proxy': `
                        export const componentKeys = ${JSON.stringify(componentKeys)};
                        export const componentProps = ${JSON.stringify(componentProps)};
                        ${components ? components.join('\n') : ''}
                    `,
					'virtual:component-registry-internal-proxy/runtime': `
                        export * from '${resolve('../runtime.js')}';
                    `,
					[virtualId]: `export * from 'virtual:component-registry-internal-proxy';`,
					[virtualRuntimeId]: `export * from 'virtual:component-registry-internal-proxy/runtime';`,
				};

				addVirtualImports(params, {
					name,
					imports: virtualImports,
				});
			}).pipe(Effect.provide(ComponentRegistry.Default))
		)
);
