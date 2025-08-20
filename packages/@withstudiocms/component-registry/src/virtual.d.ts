declare module 'virtual:component-registry-internal-proxy' {
	/**
	 * List of component keys that are registered in the component registry.
	 */
	export const componentKeys: string[];

	/**
	 * List of component properties that are registered in the component registry.
	 *
	 * Each entry in the array is an object with a `name` and `props` property.
	 * The `props` property is an array of objects representing the properties of the component.
	 */
	export const componentProps: import('./types.js').ComponentRegistryEntry[];
}

declare module 'virtual:component-registry-internal-proxy/runtime' {
	/**
	 * Represents an entry in the component registry.
	 *
	 * Extends the `AstroComponentProps` interface to include additional metadata.
	 *
	 * @property safeName - A readonly string representing a safe, unique identifier for the component.
	 */
	export type ComponentRegistryEntry = import('./runtime.js').ComponentRegistryEntry;

	/**
	 * Imports components by their keys from the 'studiocms:markdown-remark/user-components' module.
	 *
	 * @param keys - An array of strings representing the keys of the components to import.
	 * @returns A promise that resolves to an object containing the imported components.
	 * @throws {MarkdownRemarkError} If any component fails to import, an error is thrown with a prefixed message.
	 * @deprecated This function is deprecated and will be removed in future versions.
	 * Use `getRendererComponents` instead for importing components from the component registry.
	 */
	export const importComponentsKeys: typeof import('./runtime.js').importComponentsKeys;

	/**
	 * @returns A promise that resolves to an object containing the imported components.
	 */
	export const getRendererComponents: typeof import('./runtime.js').getRendererComponents;

	/**
	 * Returns the component registry entries.
	 *
	 * @returns {ComponentRegistryEntry[]} An object mapping safe component names to their registry entries.
	 */
	export const getRegistryComponents: typeof import('./runtime.js').getRegistryComponents;

	/**
	 * List of component properties that are registered in the component registry.
	 *
	 * Each entry in the array is an object with a `name` and `props` property.
	 * The `props` property is an array of objects representing the properties of the component.
	 */
	export const componentProps: import('./runtime.js').ComponentRegistryEntry[];

	/**
	 * Converts all underscores in a given string to hyphens.
	 *
	 * @param str - The input string containing underscores to be converted.
	 * @returns A new string with all underscores replaced by hyphens.
	 */
	export const convertUnderscoresToHyphens: typeof import('./runtime.js').convertUnderscoresToHyphens;
	/**
	 * Converts all hyphens in a given string to underscores.
	 *
	 * @param str - The input string containing hyphens to be converted.
	 * @returns A new string with all hyphens replaced by underscores.
	 */
	export const convertHyphensToUnderscores: typeof import('./runtime.js').convertHyphensToUnderscores;

	export const setupRendererComponentProxy: typeof import('./runtime.js').setupRendererComponentProxy;

	export const createRenderer: typeof import('./runtime.js').createRenderer;
}
