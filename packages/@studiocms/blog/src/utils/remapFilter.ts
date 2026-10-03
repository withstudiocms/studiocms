import blogConfig from 'studiocms:blog/config';
import { pathWithBase } from 'studiocms:lib';
import type { CombinedPageData } from 'studiocms:sdk/types';
import type { APIContext } from 'astro';
import { dual } from 'studiocms/effect';

const blogRouteFullPath = `${blogConfig.route}/[...slug]`;

export function getBlogRoute(slug: string) {
	return blogRouteFullPath.replace('[...slug]', slug);
}

export type SiteMapTemplate = {
	location: string;
}[];

export type { APIContext, CombinedPageData };

export const remapFilterSitemap = dual<
	(
		filter: string,
		context: APIContext,
		blog?: boolean
	) => (array: Array<CombinedPageData>) => SiteMapTemplate,
	(
		array: Array<CombinedPageData>,
		filter: string,
		context: APIContext,
		blog?: boolean
	) => SiteMapTemplate
>(4, (array, filter, context, blog = false) => {
	function genLocation(slug: string) {
		const newPath = blog ? getBlogRoute(slug) : slug;
		return new URL(pathWithBase(newPath), context.url);
	}

	return array
		.filter(({ package: pkg }) => pkg === filter)
		.map(({ slug }) => ({
			location: genLocation(slug).toString(),
		}));
});
