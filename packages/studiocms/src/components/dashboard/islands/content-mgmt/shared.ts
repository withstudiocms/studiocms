import pluginsList from 'studiocms:plugins';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';

interface PluginListItem {
	label: string;
	value: string;
}

const { data: folderList } = await studioCMS_SDK_Cache.GET.folderList();

export const { data: PageFolderTree } = await studioCMS_SDK_Cache.GET.pageFolderTree(true);

export const parentFolders = folderList.map(({ id: value, name: label }) => ({ value, label }));

// EXPORTS

export const parentFolderOptions = [{ value: 'null', label: 'None' }, ...parentFolders];

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

export const pageTypeComponents = async () => {
	const pageTypeComponents: {
		identifier: string;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		Component: (Props?: { content?: string | null | undefined }) => any;
	}[] = [];

	for (const { pageTypes } of pluginsList) {
		if (!pageTypes) {
			return pageTypeComponents;
		}

		for (const { identifier, pageContentComponent } of pageTypes) {
			if (!pageContentComponent) {
				continue;
			}

			const component = await import(/* @vite-ignore */ pageContentComponent);

			pageTypeComponents.push({
				identifier,
				Component: component.default,
			});
		}

		return pageTypeComponents;
	}

	return pageTypeComponents;
};

export const trueFalse = [
	{ label: 'Yes', value: 'true' },
	{ label: 'No', value: 'false' },
];

export const categoriesOptions = [{ label: 'None', value: 'null' }];

export const tagsOptions = [{ label: 'None', value: 'null' }];
