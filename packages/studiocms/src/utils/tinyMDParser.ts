import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';

/**
 * Parses a Markdown string and returns the rendered output to HTML.
 *
 * @param str - The Markdown string to parse.
 * @returns The rendered output as a string.
 */
export const parseMarkdown = (str: string) =>
	micromark(str, {
		extensions: [gfm()],
		htmlExtensions: [gfmHtml()],
	});
