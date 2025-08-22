import markdownIt from 'markdown-it';

const md = markdownIt({
	html: true,
	linkify: true,
});

/**
 * Parses a Markdown string and returns the rendered output to HTML.
 *
 * @param str - The Markdown string to parse.
 * @returns The rendered output as a string.
 */
export const parseMarkdown = (str: string) => md.render(str);
