import type { AstroGlobal } from 'astro';
import { cachedFetch } from '../util-server.ts';
import { StudioCMSServiceAccounts, contributorConfig } from './contributors.config.ts';

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

/**
 * Fetches data from a GitHub API endpoint recursively, handling pagination.
 *
 * @param {string} endpoint - The GitHub API endpoint to fetch data from.
 * @param {number} [page=1] - The current page number for pagination.
 * @returns {Promise<any[]>} - A promise that resolves to an array of fetched data.
 *
 * @throws {Error} - Throws an error if the request to the endpoint fails.
 */

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function recursiveFetch(endpoint: string, page?: number): Promise<any[]> {
	const pageNumber = page || 1;

	try {
		const queryParam = endpoint.includes('?') ? '&' : '?';
		const pageSize = 100;
		const url = `https://api.github.com/${endpoint}${queryParam}per_page=${pageSize}&page=${pageNumber}`;

		const token = import.meta.env.PUBLIC_GITHUB_TOKEN;

		const res = await cachedFetch(
			url,
			{
				method: 'GET',
				headers: {
					Authorization: token && `Basic ${Buffer.from(token, 'binary').toString('base64')}`,
					'User-Agent': 'studiocms-docs/1.0',
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
			const rest = await recursiveFetch(endpoint, pageNumber + 1);
			data.push(...rest);
		}

		return data;
	} catch (e) {
		printError(e as Error);
		return [];
	}
}

function filterOutBots(c: Contributor[]): Contributor[] {
	return c.filter((contributor) => !contributor.login.includes('[bot]'));
}

/**
 * Fetches all contributors for a given repository, excluding bot accounts.
 *
 * @param repo - The name of the repository to fetch contributors from.
 * @returns A promise that resolves to an array of contributors, excluding those with '[bot]' in their login.
 */
export async function getAllContributors(repo: string) {
	const endpoint = `repos/${repo}/contributors`;
	const contributors: Contributor[] = await recursiveFetch(endpoint);

	return filterOutBots(contributors);
}

/**
 * Retrieves the list of contributors for the specified paths in a given repository.
 *
 * @param paths - An array of file paths to get contributors for.
 * @param repo - The repository name in the format "owner/repo".
 * @returns A promise that resolves to an array of contributors sorted by the number of contributions in descending order.
 *
 * @remarks
 * This function fetches the commit history for each specified path and aggregates the contributors.
 * Contributors with usernames containing '[bot]' are filtered out.
 *
 * @example
 * ```typescript
 * const contributors = await getContributorsByPath(['src/index.ts', 'src/util.ts'], 'owner/repo');
 * console.log(contributors);
 * ```
 */
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

	return filterOutBots(contributors);
}

/**
 * Filters out StudioCMS service accounts from the list of contributors.
 *
 * @param {Contributor[]} c - The list of contributors to filter.
 * @returns {Contributor[]} The filtered list of contributors excluding service accounts.
 */
const filterOutStudioCMSServiceAccounts = (c: Contributor[]): Contributor[] => {
	const currentServiceAccounts = StudioCMSServiceAccounts;

	return c.filter((contributor) => !currentServiceAccounts.includes(contributor.login));
};

/**
 * Checks if contributors exist in the existing contributors list and updates the list accordingly.
 *
 * If a contributor from the new contributors list does not exist in the existing contributors list,
 * it adds the contributor to the existing list. If the contributor already exists, it updates the
 * contributions count by adding the contributions from the new contributor.
 *
 * @param existingContributors - The list of existing contributors.
 * @param newContributors - The list of new contributors to be checked and added or updated.
 */
function checkIfContributorExists(
	existingContributors: Contributor[],
	newContributors: Contributor[]
) {
	for (const contributor of newContributors) {
		const existingContributor = existingContributors.find((c) => c.id === contributor.id);

		if (!existingContributor) {
			existingContributors.push(contributor);
		} else {
			existingContributor.contributions += contributor.contributions;
		}
	}
}

/**
 * Retrieves a breakdown of contributors for various repositories and paths as specified in the configuration.
 *
 * @returns {Promise<Breakdown[]>} A promise that resolves to an array of breakdowns, each containing a name and a list of contributors.
 *
 * The function iterates over a configuration object, which contains a list of repositories and paths.
 * For each repository and path, it fetches the contributors either by path or for the entire repository.
 * The contributors are then filtered to remove service accounts specific to StudioCMS.
 */
export async function getContributorBreakdown(Astro: AstroGlobal): Promise<Breakdown[]> {
	const config = contributorConfig(Astro);

	const breakdowns: Breakdown[] = [];

	for (const { name, list } of config) {
		const contributors: Contributor[] = [];

		for (const { repo, type, paths } of list) {
			if (type === 'byPath' && paths) {
				const data = await getContributorsByPath(paths, repo);
				checkIfContributorExists(contributors, data);
			} else {
				const data = await getAllContributors(repo);
				checkIfContributorExists(contributors, data);
			}
		}

		breakdowns.push({
			name,
			contributors: filterOutStudioCMSServiceAccounts(contributors).sort(
				(a, b) => b.contributions - a.contributions
			),
		});
	}

	return breakdowns;
}
