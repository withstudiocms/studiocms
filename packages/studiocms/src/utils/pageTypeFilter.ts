export function rendererComponentFilter(comp: string | undefined, safePageType: string) {
	if (!comp) {
		throw new Error(`Renderer Component path is required for page type: ${safePageType}`);
	}
	return `export { default as ${safePageType} } from '${comp}';`;
}

export function pageContentComponentFilter(comp: string | undefined, safePageType: string) {
	if (!comp) {
		throw new Error(`Page Content Component path is required for page type: ${safePageType}`);
	}
	return `export { default as ${safePageType} } from '${comp}';`;
}
