export const makePageTitle = (
	pageName: string,
	config: {
		title: string;
	},
	separator?: string
) => {
	const separatorString = separator ? `${separator}` : '|';

	return `${pageName} ${separatorString} ${config.title}`;
};
