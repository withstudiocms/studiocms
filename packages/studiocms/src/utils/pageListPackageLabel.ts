export const fixPackageLabel = (
	packageName: string,
	pluginList: Map<
		string,
		{
			name: string;
			label: string;
		}
	>
) => {
	const PluginLabels = Array.from(pluginList.values());

	for (const plugin of PluginLabels) {
		if (plugin.name === packageName) {
			return plugin.label;
		}
	}
	return 'Unknown';
};
