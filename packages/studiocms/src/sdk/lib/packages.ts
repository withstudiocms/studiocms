import pluginsList from 'studiocms:plugins';

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

export type PageType = (typeof pageTypeList)[number];
