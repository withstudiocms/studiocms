type DefaultPageTypeComponents = {
	[x: string]: {
		pageContentComponent: string;
		rendererComponent: string;
	};
};

export function rendererComponentFilter(
	comp: string,
	safePageType: string,
	defaultPageTypeComponents: DefaultPageTypeComponents
) {
	if (comp in defaultPageTypeComponents) {
		return `export { default as ${safePageType} } from '${defaultPageTypeComponents[comp].rendererComponent}';`;
	}
	return null;
}

export function pageContentComponentFilter(
	comp: string | undefined,
	safePageType: string,
	defaultPageTypeComponents: DefaultPageTypeComponents
) {
	let safeComp = comp;

	if (!safeComp) {
		safeComp = `export { default as ${safePageType} } from '${defaultPageTypeComponents['studiocms/markdown'].pageContentComponent}';`;

		return safeComp;
	}

	if (safeComp in defaultPageTypeComponents) {
		return `export { default as ${safePageType} } from '${defaultPageTypeComponents[safeComp].pageContentComponent}';`;
	}

	return `export { default as ${safePageType} } from '${safeComp}';`;
}
