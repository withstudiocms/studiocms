import blogConfig from 'studiocms:blog/config';
import { pathWithBase } from 'studiocms:lib';
import type { APIContext } from 'astro';
import { dual } from 'studiocms/effect';
import type { PageDataCacheObject } from 'studiocms/sdk/types';

const blogRouteFullPath = `${blogConfig.route}/[...slug]`;

export function getBlogRoute(slug: string) {
	if (blogRouteFullPath) {
		return blogRouteFullPath.replace('[...slug]', slug);
	}
	/* v8 ignore start */
	return '#';
}
/* v8 ignore stop */

export type SiteMapTemplate = {
	location: string;
}[];

export type { APIContext, PageDataCacheObject };

export const remapFilterSitemap = dual<
	(
		filter: string,
		context: APIContext,
		blog?: boolean
	) => (array: Array<PageDataCacheObject>) => SiteMapTemplate,
	(
		array: Array<PageDataCacheObject>,
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
		.map(({ data }) => data)
		.filter(({ package: pkg }) => pkg === filter)
		.map(({ slug }) => ({
			location: genLocation(slug).toString(),
		}));
});
