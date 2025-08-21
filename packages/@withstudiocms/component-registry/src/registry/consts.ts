import type { ComponentRegistryEntry } from '../types.js';

export const InternalId = 'virtual:component-registry-internal-proxy';
export const RuntimeInternalId = `${InternalId}/runtime`;

export const buildVirtualImport = (
	componentKeys: string[],
	componentProps: ComponentRegistryEntry[],
	components: string[]
) => `
export const componentKeys = ${JSON.stringify(componentKeys)};
export const componentProps = ${JSON.stringify(componentProps)};
${components ? components.join('\n') : ''}
`;

export const buildAliasExports = (virtualId: string) => ({
	[virtualId]: `export * from '${InternalId}';`,
	[`${virtualId}/runtime`]: `export * from '${RuntimeInternalId}';`,
});
