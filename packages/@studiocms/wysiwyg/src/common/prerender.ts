import { parse } from "./utils.js";

/**
 * Asynchronously pre-renders HTML content from a serialized string.
 *
 * Attempts to parse the provided content string and extract the `__STUDIOCMS_HTML` property.
 * If the content is missing, invalid, or parsing fails, returns an appropriate error message as HTML.
 *
 * @param content - The serialized content string to be parsed and rendered.
 * @returns A promise that resolves to the rendered HTML string or an error message in HTML format.
 */
export const preRenderer = async (content: string) => {
	let parsedContent = '<h1>Error: No content found</h1>';

	if (!content) {
		return parsedContent;
	}

	try {
		const { __STUDIOCMS_HTML } = parse<{ __STUDIOCMS_HTML: string }>(content);
		if (__STUDIOCMS_HTML) {
			parsedContent = __STUDIOCMS_HTML;
		} else {
			parsedContent = '<h1>Error: Content found but invalid format</h1>';
		}
	} catch (error) {
		console.error('Error parsing content:', error);
		parsedContent = `<h1>Error parsing content: ${error instanceof Error ? error.message : 'Unknown error'}</h1>`;
	}

	return parsedContent;
};