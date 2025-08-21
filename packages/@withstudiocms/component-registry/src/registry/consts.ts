import type { ComponentRegistryEntry } from '../types.js';

/**
 * Internal virtual module ID for the component registry.
 */
export const InternalId = 'virtual:component-registry-internal-proxy';

/**
 * Runtime virtual module ID for the component registry.
 */
export const RuntimeInternalId = `${InternalId}/runtime`;

/**
 * Builds a virtual import string that exports component keys, component props, and component definitions.
 *
 * @param componentKeys - An array of strings representing the keys of the components to be registered.
 * @param componentProps - An array of `ComponentRegistryEntry` objects containing the props for each component.
 * @param components - An array of strings, each representing a component's code to be included in the export.
 * @returns A string containing the virtual import code that exports the component keys, props, and component definitions.
 */
export const buildVirtualImport = (
	componentKeys: string[],
	componentProps: ComponentRegistryEntry[],
	components: string[]
) => `
export const componentKeys = ${JSON.stringify(componentKeys)};
export const componentProps = ${JSON.stringify(componentProps)};
${components ? components.join('\n') : ''}
`;

/**
 * Builds an object mapping virtual module IDs to their corresponding export statements.
 *
 * @param virtualId - The base virtual module ID to use as the key.
 * @returns An object where:
 *   - The key `virtualId` maps to an export statement for `InternalId`.
 *   - The key `${virtualId}/runtime` maps to an export statement for `RuntimeInternalId`.
 *
 * @example
 * ```typescript
 * const exports = buildAliasExports('my-module');
 * // {
 * //   'my-module': "export * from 'InternalId';",
 * //   'my-module/runtime': "export * from 'RuntimeInternalId';"
 * // }
 * ```
 */
export const buildAliasExports = (virtualId: string) => ({
	[virtualId]: `export * from '${InternalId}';`,
	[`${virtualId}/runtime`]: `export * from '${RuntimeInternalId}';`,
});
