import pluginsList from 'studiocms:plugins';

interface PluginListItem {
	label: string;
	value: string;
}

export const pageTypeOptions = pluginsList.flatMap(({ pageTypes }) => {
	const pageTypeOutput: PluginListItem[] = [];

	if (!pageTypes) {
		return pageTypeOutput;
	}

	for (const { label, identifier } of pageTypes) {
		pageTypeOutput.push({ label, value: identifier });
	}

	return pageTypeOutput;
});

export const trueFalse = [
	{ label: 'True', value: 'true' },
	{ label: 'False', value: 'false' },
];

export const categoriesOptions = [{ label: 'None', value: 'null' }];

export const tagsOptions = [{ label: 'None', value: 'null' }];
