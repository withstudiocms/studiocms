/// <reference types="../virtual.d.ts" preserve="true" />

import { deepmerge, Effect, runEffect, Schema } from '@withstudiocms/effect';
import { addVirtualImports, defineUtility } from 'astro-integration-kit';
import type { ComponentRegistryEntry } from '../types.js';
import { convertHyphensToUnderscores, integrationLogger, resolver } from '../utils.js';
import {
	buildAliasExports,
	buildVirtualImport,
	InternalId,
	NameInternalId,
	RuntimeInternalId,
} from './consts.js';
import { ComponentRegistry } from './Registry.js';

/**
 * Schema describing a plain object whose property names and property values are both strings.
 *
 * Each entry is represented as a key/value pair where the key is validated as a string and
 * the corresponding value must also be a string. This is useful for simple string-to-string
 * dictionaries such as metadata maps, headers, labels, or other flat string maps.
 *
 * Remarks:
 * - Validation is shallow: nested objects or arrays as values are not allowed.
 * - JavaScript object keys are strings (or symbols); this schema enforces that the values
 *   stored under those keys are strings.
 *
 * Example:
 * ```
 * // Valid
 * { "foo": "bar", "baz": "qux" }
 *
 * // Invalid (non-string value)
 * { "count": 42 }
 * ```
 *
 * @see Schema.Record
 * @public
 */
const StringRecordSchema = Schema.Record({ key: Schema.String, value: Schema.String });

/**
 * Schema for validating options passed to the component registry.
 *
 * @remarks
 * This schema enforces the shape of the options object used to configure the
 * component registry. It expects a required top-level `config` object and two
 * optional record maps (`componentRegistry` and `builtInComponents`) keyed by
 * string. The schema is intended to be used with the project's `Schema` utility
 * to validate runtime inputs.
 *
 * @property config - Required configuration object for the registry.
 * @property config.name - The required name of the registry instance (string).
 * @property config.virtualId - Optional virtual identifier used for lookup or
 *   resolution (string).
 * @property config.verbose - Optional flag to enable verbose logging or
 *   diagnostics (boolean).
 * @property componentRegistry - Optional string-keyed record describing
 *   externally provided components or component entries. The exact shape of
 *   each record value is defined by `StringRecordSchema` in the codebase.
 * @property builtInComponents - Optional string-keyed record describing
 *   built-in components provided by the system. Also uses `StringRecordSchema`.
 *
 * @example
 * // Example shape that conforms to this schema:
 * // {
 * //   config: { name: "my-registry", virtualId: "v1", verbose: true },
 * //   componentRegistry: { "button": "/components/button" },
 * //   builtInComponents: { "text": "/components/text" }
 * // }
 */
export const ComponentRegistryOptionsSchema = Schema.Struct({
	config: Schema.Struct({
		name: Schema.String,
		virtualId: Schema.optional(Schema.String),
		verbose: Schema.optional(Schema.Boolean),
	}),
	componentRegistry: Schema.optional(StringRecordSchema),
	builtInComponents: Schema.optional(StringRecordSchema),
});

/**
 * Represents the TypeScript type inferred from the runtime schema that defines options for the component registry.
 *
 * This alias is produced by applying the schema-to-type helper (Schema.Schema.Type) to the schema that describes
 * the registry options. Use this type when declaring or validating objects that will be passed to the component
 * registry to ensure compile-time alignment with the runtime schema.
 *
 * Notes:
 * - The precise shape, allowed properties, and defaults are determined by the underlying schema; consult that
 *   schema for the authoritative specification of each option.
 * - Because this type is derived from the schema, updating the schema will automatically update this type.
 */
export type ComponentRegistryOptions = Schema.Schema.Type<typeof ComponentRegistryOptionsSchema>;

/* v8 ignore start */

/**
 * Handler for the "astro:config:setup" utility that configures and populates the component registry for an Astro integration.
 *
 * This handler:
 * - Decodes and validates the provided options using the ComponentRegistryOptionsSchema.
 * - Forks and configures a logger scoped to the integration name, supporting a verbose mode for more detailed output.
 * - Merges built-in components with user-provided component registry entries.
 * - Iterates the merged registry and validates each entry:
 *   - Only string paths ending with ".astro" are considered.
 *   - Each component path is resolved via Astro's resolver; failures are logged and the entry is skipped.
 * - Registers successfully resolved components with the ComponentRegistry effect and collects component metadata (props).
 * - Constructs virtual imports for:
 *   - A generated component index (exports for each detected component).
 *   - A name export for the integration.
 *   - A runtime module import.
 *   - Optional alias exports when `virtualId` is provided.
 * - Adds the virtual imports to Astro's config so they are available at runtime.
 * - Emits informative log messages throughout; when `verbose` is true and there are few components, it logs the extracted component props in full.
 *
 * @remarks
 * - The handler operates within the Effect runtime and uses an injected ComponentRegistry implementation (ComponentRegistry.Default by default).
 * - Path resolution and registry interactions are handled as Effects; resolution errors are caught and logged so processing continues for other entries.
 * - The handler gracefully skips invalid, non-".astro", or unresolved component entries instead of failing fast.
 *
 * @param params - The Astro config setup parameters provided by defineUtility('astro:config:setup'). Contains the integration config, root path, logger, and other environment helpers used for resolving and registering components.
 * @param opts - Options validated against ComponentRegistryOptionsSchema. Typical fields include:
 *   - name: string — name of the integration (used for log scoping and virtual exports).
 *   - verbose?: boolean — enable verbose logging.
 *   - virtualId?: string — optional virtual alias identifier to emit alias exports.
 *   - builtInComponents?: Record<string, string> — default components provided by the integration.
 *   - componentRegistry?: Record<string, string> — user-provided component mapping.
 *
 * @returns An Effect-wrapped completion of the setup process. When executed, the effect configures the ComponentRegistry, registers components, and installs virtual imports into the Astro configuration. Any non-fatal errors encountered during resolution or registration are logged and cause the individual entry to be skipped; unrecoverable errors will surface as Effect failures.
 *
 * @throws Resolution or registry errors are handled per-entry and logged; fatal errors related to effect provisioning or unexpected failures may be thrown as Effect failures.
 *
 * @example
 * // Conceptual usage (options shape)
 * // {
 * //   name: 'my-integration',
 * //   verbose: true,
 * //   virtualId: 'virtual:components',
 * //   builtInComponents: { Header: './components/Header.astro' },
 * //   componentRegistry: { Footer: './src/components/Footer.astro' }
 * // }
 */
export const componentRegistryHandler = defineUtility('astro:config:setup')(
	async (params, opts: ComponentRegistryOptions) =>
		await runEffect(
			Effect.gen(function* () {
				// Decode and validate options using Effect's Schema
				const {
					config: { verbose = false, name, virtualId },
					builtInComponents = {},
					componentRegistry = {},
				} = yield* Schema.decode(ComponentRegistryOptionsSchema)(opts);

				// Fork a logger for the component registry
				const logger = params.logger.fork(`${name}:component-registry`);
				const logInfo = { logger, logLevel: 'info' as const, verbose };

				// Log the start of the component registry setup
				integrationLogger(logInfo, 'Setting up component registry...');

				// Resolve necessary paths and registry
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

				// Get entries of the component registry to check
				const componentRegistryEntries = Object.entries(componentRegistryToCheck);

				// Check if there are any components to process
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

				// Get all component props from the registry
				const componentProps: ComponentRegistryEntry[] = yield* registry.getAllComponents().pipe(
					Effect.map((map) => Array.from(map.entries())),
					Effect.map((array) =>
						array.map(([iName, data]) => ({
							...data,
							name: iName,
							safeName: convertHyphensToUnderscores(iName),
						}))
					)
				);

				integrationLogger(logInfo, `Total component props extracted: ${componentProps.length}`);

				// Log registered components based on verbosity and count
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

				// Resolve the virtual runtime import path
				const virtualRuntimeImport = yield* resolve((fn) => fn('../runtime.js'));

				// Add virtual imports for the component registry
				addVirtualImports(params, {
					name,
					imports: {
						[InternalId]: buildVirtualImport(componentKeys, componentProps, components),
						[NameInternalId]: `export default '${name}'; export const name = '${name}';`,
						[RuntimeInternalId]: `export * from '${virtualRuntimeImport}';`,
						...(virtualId ? buildAliasExports(virtualId) : {}),
					},
				});

				// Log the completion of the component registry setup
				integrationLogger(logInfo, 'Component registry setup complete.');
			}).pipe(Effect.provide(ComponentRegistry.Default))
		)
);

/* v8 ignore stop */
