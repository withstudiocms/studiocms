import pluginsList from 'studiocms:plugins';
import { runSDK, SDKCoreJs } from 'studiocms:sdk';

interface PluginListItem {
	label: string;
	value: string;
}

const { data: folderList } = await runSDK(SDKCoreJs.GET.folderList());

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

export const trueFalse = [
	{ label: 'True', value: 'true' },
	{ label: 'False', value: 'false' },
];

export const categoriesOptions = [{ label: 'None', value: 'null' }];

export const tagsOptions = [{ label: 'None', value: 'null' }];
