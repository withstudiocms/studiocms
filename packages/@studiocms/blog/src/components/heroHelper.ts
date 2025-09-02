import type { AstroGlobal } from 'astro';
import { FALLBACK_OG_IMAGE } from './consts.js';

/**
 * Trims leading and trailing whitespace from the given input string.
 *
 * @param input - The string to trim. Can be `string`, `null`, or `undefined`.
 * @returns The trimmed string, or `undefined` if the input is `null` or `undefined`.
 */
export function trimInput(input: string | null | undefined): string | undefined {
	if (!input) return undefined;
	return input.trim();
}

/**
 * Retrieves the appropriate hero image URL based on the provided `hero` string,
 * the site's default OG image, or a fallback image.
 *
 * The function checks the following, in order:
 * 1. If a valid `hero` image URL is provided, it returns that.
 * 2. If not, it attempts to use the site's default OG image from the Astro global context.
 * 3. If neither is available, it returns a constant fallback image URL.
 *
 * @param hero - The primary hero image URL, or `undefined` if not provided.
 * @param Astro - The Astro global context, used to access site configuration.
 * @returns The resolved hero image URL as a string.
 */
export function getHeroImage(hero: string | undefined, Astro: AstroGlobal): string {
	const primary = trimInput(hero);
	const siteFallback = trimInput(Astro.locals.StudioCMS.siteConfig.data.defaultOgImage);
	if (primary) return primary;
	if (siteFallback) return siteFallback;
	return FALLBACK_OG_IMAGE;
}
