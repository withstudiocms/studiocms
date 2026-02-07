/**
 * Generates an export statement for a renderer component based on the provided component path and page type.
 *
 * @param comp - The path to the renderer component. Must be a non-undefined string.
 * @param safePageType - The page type to use as the exported name.
 * @returns An export statement string that re-exports the default export of the component under the given page type name.
 * @throws {Error} If the `comp` parameter is undefined.
 */
export function rendererComponentFilter(comp: string | undefined, safePageType: string) {
	if (!comp) {
		throw new Error(`Renderer Component path is required for page type: ${safePageType}`);
	}
	return `export { default as ${safePageType} } from '${comp}';`;
}

/**
 * Generates an export statement for a page content component based on the provided component path and page type.
 *
 * @param comp - The path to the component as a string. If undefined, an error is thrown.
 * @param safePageType - The safe page type string used as the export alias.
 * @returns An export statement string that re-exports the default export of the component under the given page type alias.
 * @throws {Error} If the `comp` parameter is not provided.
 */
export function pageContentComponentFilter(comp: string | undefined, safePageType: string) {
	if (!comp) {
		throw new Error(`Page Content Component path is required for page type: ${safePageType}`);
	}
	return `export { default as ${safePageType} } from '${comp}';`;
}
