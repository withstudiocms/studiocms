import { pipe } from '../../../../../effect.js';

/**
 * Returns the normalized domain string for Auth0 authentication.
 *
 * This function performs the following transformations:
 * - Removes any leading slash from the domain.
 * - Strips out the "http://" or "https://" protocol from the domain.
 * - Prepends "https://" to the resulting domain.
 *
 * @returns {string} The normalized domain string with "https://" prepended.
 */
export const cleanDomain = (domain: string): string =>
	pipe(
		domain,
		(domain) => domain.replace(/^\//, ''),
		(domain) => domain.replace(/(?:http|https):\/\//, ''),
		(domain) => `https://${domain}`
	);
