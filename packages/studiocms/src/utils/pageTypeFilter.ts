export function rendererComponentFilter(
	comp: string,
	safePageType: string,
) {
	if (!comp) {
		throw new Error(`Component path is required for page type: ${safePageType}`);
	}
	return `export { default as ${safePageType} } from '${comp}';`;
}

export function pageContentComponentFilter(
	comp: string | undefined,
	safePageType: string,
) {
	if (!comp) {
		throw new Error(`Component path is required for page type: ${safePageType}`);
	}
	return `export { default as ${safePageType} } from '${comp}';`;
}
