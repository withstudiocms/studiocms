import type { WysiwygDBContent } from '../types.js';
import { parse } from './utils.js';

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
	// Initialize the parsed content with a default error message
	// This will be returned if no valid content is found
	let parsedContent = '<h1>Error: No content found</h1>';

	// If the content is empty, return the default error message
	if (!content) {
		return parsedContent;
	}

	try {
		// Attempt to parse the content string to extract the `__STUDIOCMS_HTML` property
		const { __STUDIOCMS_HTML } = parse<WysiwygDBContent>(content);

		// If the `__STUDIOCMS_HTML` property is found, set it as the parsed content
		// Otherwise, return an error message indicating invalid format
		if (__STUDIOCMS_HTML) {
			parsedContent = __STUDIOCMS_HTML;
		} else {
			parsedContent = '<h1>Error: Content found but invalid format</h1>';
		}
	} catch (error) {
		// If parsing fails, log the error and return an error message
		// This ensures that any issues during parsing do not crash the application
		console.error('Error parsing content:', error);
		parsedContent = `<h1>Error parsing content: ${error instanceof Error ? error.message : 'Unknown error'}</h1>`;
	}

	// Return the final parsed content, which may be an error message or valid HTML
	return parsedContent;
};
