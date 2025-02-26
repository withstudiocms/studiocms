import pluginsList from 'studiocms:plugins';

/**
 * List of all page types available in the StudioCMS instance.
 */
export const pageTypeList = pluginsList.flatMap(({ pageTypes }) => {
	const pageTypeOutput: string[] = [];

	if (!pageTypes) {
		return pageTypeOutput;
	}

	for (const { identifier } of pageTypes) {
		pageTypeOutput.push(identifier);
	}

	return pageTypeOutput;
});

/**
 * Type of a page in the StudioCMS instance.
 */
export type PageType = (typeof pageTypeList)[number];
