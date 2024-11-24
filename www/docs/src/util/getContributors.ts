import { cachedFetch } from '../util-server';

export interface Contributor {
	login: string;
	id: number;
	contributions: number;
	avatar_url?: string;
}

interface Commit {
	author: {
		login: string;
		id: number;
	};
	commit: {
		message: string;
	};
}

type Breakdown = {
	name: string;
	contributors: Contributor[];
};

const printError = (e: Error) =>
	console.warn(`[error]  /src/util/getContributors.ts\n         ${e?.message ?? e}`);

async function recursiveFetch(endpoint: string, page = 1) {
	try {
		const queryParam = endpoint.includes('?') ? '&' : '?';
		const pageSize = 100;
		const url = `https://api.github.com/${endpoint}${queryParam}per_page=${pageSize}&page=${page}`;

		const token = import.meta.env.PUBLIC_GITHUB_TOKEN;

		const res = await cachedFetch(
			url,
			{
				method: 'GET',
				headers: {
					Authorization: token && `Basic ${Buffer.from(token, 'binary').toString('base64')}`,
					'User-Agent': 'astro-docs/1.0',
				},
			},
			{ duration: '15m' }
		);

		const data = await res.json();

		if (!res.ok) {
			throw new Error(
				`Request to fetch endpoint failed. Reason: ${res.statusText}
         Message: ${data?.message}`
			);
		}

		// Fetch more data recursively if there are more than GitHub’s per-page response limit.
		if (data.length === pageSize) {
			const rest = await recursiveFetch(endpoint, page + 1);
			data.push(...rest);
		}

		return data;
	} catch (e) {
		printError(e as Error);
		return [];
	}
}

export async function getAllContributors(repo: string) {
	const endpoint = `repos/${repo}/contributors`;
	const contributors: Contributor[] = await recursiveFetch(endpoint);

	return contributors.filter((c) => !c.login.includes('[bot]'));
}

export async function getContributorsByPath(paths: string[], repo: string) {
	const contributors: Contributor[] = [];

	for (const path of paths) {
		const endpoint = `repos/${repo}/commits?path=${path}`;
		const commits: Commit[] = await recursiveFetch(endpoint);

		for (const { author } of commits) {
			if (!author) continue;
			const contributor = contributors.find((contributor) => contributor.id === author.id);

			if (!contributor) {
				contributors.push({
					id: author.id,
					login: author.login,
					contributions: 1,
				});
				continue;
			}
			contributor.contributions += 1;
		}
	}

	return contributors
		.filter((c) => !c.login.includes('[bot]'))
		.sort((a, b) => b.contributions - a.contributions);
}

const studiocmsPaths: string[] = [
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
] as const;

const studiocmsPluginPaths: string[] = [
	// OLD Paths
	'packages/studioCMSBlog/',
	// NEW Paths
	'packages/studiocms_blog/',
] as const;

const studiocmsDevAppsPaths: string[] = ['packages/studiocms_devapps/'] as const;

const studiocmsUIPaths: string[] = ['packages/studiocms_ui/', 'playgrounds/ui/'] as const;

const studiocmsDocsPaths: string[] = ['www/docs/'] as const;

const studiocmsWebsitePaths: string[] = ['src/', 'www/web/'] as const;

const filterOutStudioCMSServiceAccounts = (c: Contributor[]) => {
	const currentServiceAccounts = ['studiocms-no-reply'];

	return c.filter((contributor) => !currentServiceAccounts.includes(contributor.login));
};

export async function getContributorBreakdown(githubRepo?: string): Promise<Breakdown[]> {
	const mainRepo = 'withstudiocms/studiocms';
	const webRepo = 'withstudiocms/studiocms.dev';

	let repo = mainRepo;

	if (githubRepo) {
		repo = githubRepo;
	}

	const [studiocms, studiocms_ui, docs, web, plugins, devapps] = await Promise.all([
		getContributorsByPath(studiocmsPaths, repo),
		getContributorsByPath(studiocmsUIPaths, repo),
		getContributorsByPath(studiocmsDocsPaths, repo),
		getContributorsByPath(studiocmsWebsitePaths, repo),
		getContributorsByPath(studiocmsPluginPaths, repo),
		getContributorsByPath(studiocmsDevAppsPaths, repo),
	]);

	const newWebsite = await getContributorsByPath(studiocmsWebsitePaths, webRepo);

	for (const contributor of newWebsite) {
		const existingContributor = web.find((c) => c.id === contributor.id);

		if (existingContributor) {
			existingContributor.contributions += contributor.contributions;
		} else {
			web.push(contributor);
		}
	}

	return [
		{
			name: 'StudioCMS Core Packages',
			contributors: filterOutStudioCMSServiceAccounts(studiocms),
		},
		{
			name: 'StudioCMS UI Library',
			contributors: filterOutStudioCMSServiceAccounts(studiocms_ui),
		},
		{
			name: 'StudioCMS DevApps',
			contributors: filterOutStudioCMSServiceAccounts(devapps),
		},
		{
			name: 'StudioCMS Plugins',
			contributors: filterOutStudioCMSServiceAccounts(plugins),
		},
		{
			name: 'StudioCMS Documentation',
			contributors: filterOutStudioCMSServiceAccounts(docs),
		},
		{
			name: 'StudioCMS Website',
			contributors: filterOutStudioCMSServiceAccounts(web),
		},
	];
}
