type RepoListItem = {
	repo: string;
	type: 'all' | 'byPath';
	paths?: string[];
};

type ContributorConfig = {
	name: string;
	list: RepoListItem[];
};

export const StudioCMSServiceAccounts: string[] = ['studiocms-no-reply'];

export const contributorConfig: ContributorConfig[] = [
	{
		name: 'StudioCMS Core Packages',
		list: [
			{
				repo: 'withstudiocms/studiocms',
				type: 'byPath',
				paths: [
					// OLD Paths
					'packages/studioCMS/',
					// NEW Paths
					'README.md',
					'playgrounds/node/',
					'packages/studiocms/',
					'packages/studiocms_assets/',
					'packages/studiocms_auth/',
					'packages/studiocms_betaresources/',
					'packages/studiocms_core/',
					'packages/studiocms_dashboard/',
					'packages/studiocms_frontend/',
					'packages/studiocms_imagehandler/',
					'packages/studiocms_renderers/',
					'packages/studiocms_robotstxt/',
				],
			},
		],
	},
	{
		name: 'StudioCMS UI Library',
		list: [
			{
				repo: 'withstudiocms/studiocms',
				type: 'byPath',
				paths: ['packages/studiocms_ui/', 'playgrounds/ui/'],
			},
		],
	},
	{
		name: 'StudioCMS DevApps',
		list: [
			{
				repo: 'withstudiocms/studiocms',
				type: 'byPath',
				paths: ['packages/studiocms_devapps/'],
			},
		],
	},
	{
		name: 'StudioCMS Plugins',
		list: [
			{
				repo: 'withstudiocms/studiocms',
				type: 'byPath',
				paths: [
					// OLD Paths
					'packages/studioCMSBlog/',
					// NEW Paths
					'packages/studiocms_blog/',
				],
			},
		],
	},
	{
		name: 'StudioCMS Documentation',
		list: [
			{
				repo: 'withstudiocms/studiocms',
				type: 'byPath',
				paths: ['www/docs/'],
			},
		],
	},
	{
		name: 'StudioCMS Website',
		list: [
			{
				repo: 'withstudiocms/studiocms',
				type: 'byPath',
				paths: ['www/web/'],
			},
			{
				repo: 'withstudiocms/studiocms.dev',
				type: 'all',
			},
		],
	},
	{
		name: 'StudioCMS Bots',
		list: [
			{
				repo: 'withstudiocms/apollo',
				type: 'all',
			},
		],
	},
];
