import { extname } from 'node:path';
import version from 'studiocms:version';
import type { AstroGlobalPartial } from 'astro';
import type { z } from 'astro/zod';
import { lookup } from 'mrmime';
import { StudioCMSCoreError } from '../../errors.js';
import { HeadConfigSchema } from './head.js';

const _schema = HeadConfigSchema;

/**
 * A union type representing the possible file extensions for favicon images.
 *
 * The supported file extensions are:
 * - `.ico`: Icon file format
 * - `.gif`: Graphics Interchange Format
 * - `.jpeg`: JPEG image format
 * - `.jpg`: JPEG image format
 * - `.png`: Portable Network Graphics
 * - `.svg`: Scalable Vector Graphics
 */
type faviconTypeMap = '.ico' | '.gif' | '.jpeg' | '.jpg' | '.png' | '.svg';

/**
 * An array of file extensions representing different types of favicons.
 *
 * @type {faviconTypeMap[]}
 * @example
 * // Example usage:
 * const faviconExtensions = faviconTypes;
 * console.log(faviconExtensions); // ['.ico', '.gif', '.jpeg', '.jpg', '.png', '.svg']
 */
const faviconTypes: faviconTypeMap[] = ['.ico', '.gif', '.jpeg', '.jpg', '.png', '.svg'];

/**
 * Checks if the given file extension is a valid favicon type.
 *
 * @param ext - The file extension to check.
 * @returns A boolean indicating whether the extension is a valid favicon type.
 */
function isFaviconExt(ext: string): ext is faviconTypeMap {
	if (faviconTypes.includes(ext as faviconTypeMap)) {
		return true;
	}
	return false;
}

/**
 * Generates a favicon object with the appropriate href and type based on the provided favicon file.
 *
 * @param favicon - The path or URL to the favicon file.
 * @returns An object containing the href and type of the favicon.
 * @throws {StudioCMSCoreError} If the favicon extension is not supported.
 */
const makeFavicon = (favicon: string) => {
	const ext = extname(favicon).toLocaleLowerCase();
	if (isFaviconExt(ext)) {
		const faviconHref = favicon;
		const faviconType = lookup(ext);
		return { href: faviconHref, type: faviconType };
	}
	throw new StudioCMSCoreError(
		`Unsupported favicon extension: ${ext}`,
		`The favicon must be one of the following types: ${faviconTypes.join(', ')}`
	);
};

/**
 * Default Head Tags for use with createHead() helper
 *
 * @param title
 * @param description
 * @param lang
 * @param Astro
 * @param favicon
 * @param ogImage
 * @param canonical
 * @returns
 */
export const headDefaults = (
	title: string,
	description: string,
	lang: string,
	Astro: AstroGlobalPartial,
	favicon: string,
	ogImage: string | undefined,
	canonical: URL | undefined
) => {
	const headDefaults: z.input<ReturnType<typeof _schema>> = [
		{ tag: 'meta', attrs: { charset: 'utf-8' } },
		{
			tag: 'meta',
			attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1' },
		},
		{ tag: 'title', content: `${title}` },
		{ tag: 'meta', attrs: { name: 'title', content: title } },
		{ tag: 'meta', attrs: { name: 'description', content: description } },
		{ tag: 'link', attrs: { rel: 'canonical', href: canonical?.href } },
		{ tag: 'meta', attrs: { name: 'generator', content: Astro.generator } },
		{
			tag: 'meta',
			attrs: { name: 'generator', content: `StudioCMS v${version}` },
		},
		// Favicon
		{
			tag: 'link',
			attrs: {
				rel: 'shortcut icon',
				href: makeFavicon(favicon).href,
				type: makeFavicon(favicon).type,
			},
		},
		// OpenGraph Tags
		{ tag: 'meta', attrs: { property: 'og:title', content: title } },
		{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
		{ tag: 'meta', attrs: { property: 'og:url', content: canonical?.href } },
		{ tag: 'meta', attrs: { property: 'og:locale', content: lang } },
		{ tag: 'meta', attrs: { property: 'og:description', content: description } },
		{ tag: 'meta', attrs: { property: 'og:site_name', content: title } },
		// Twitter Tags
		{
			tag: 'meta',
			attrs: { name: 'twitter:card', content: 'summary_large_image' },
		},
		{ tag: 'meta', attrs: { name: 'twitter:url', content: canonical?.href } },
		{ tag: 'meta', attrs: { name: 'twitter:title', content: title } },
		{ tag: 'meta', attrs: { name: 'twitter:description', content: description } },
	];

	if (ogImage) {
		headDefaults.push(
			{ tag: 'meta', attrs: { property: 'og:image', content: ogImage } },
			{ tag: 'meta', attrs: { name: 'twitter:image', content: ogImage } }
		);
	}

	return headDefaults;
};
