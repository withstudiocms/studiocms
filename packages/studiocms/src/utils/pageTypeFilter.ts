export function rendererComponentFilter(
	comp: string,
	safePageType: string,
) {
	return `export { default as ${safePageType} } from '${comp}';`;
}

export function pageContentComponentFilter(
	comp: string | undefined,
	safePageType: string,
) {
	return `export { default as ${safePageType} } from '${comp}';`;
}
