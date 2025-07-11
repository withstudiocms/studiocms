import blogConfig from 'studiocms:blog/config';
import { pathWithBase } from 'studiocms:lib';
import type { PageDataCacheObject } from 'studiocms:sdk/types';
import type { APIContext } from 'astro';
import { dual } from 'studiocms/effect';

const blogRouteFullPath = `${blogConfig.route}/[...slug]`;

export function getBlogRoute(slug: string) {
	if (blogRouteFullPath) {
		return blogRouteFullPath.replace('[...slug]', slug);
	}
	return '#';
}

export type SiteMapTemplate = {
	location: string;
}[];

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
