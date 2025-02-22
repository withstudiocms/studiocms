import { MarkdownPageEvent } from 'typedoc-plugin-markdown';

/** @param {import('typedoc-plugin-markdown').MarkdownApplication} app */
export function load(app) {
	app.renderer.on(
		MarkdownPageEvent.BEGIN,
		/** @param {MarkdownPageEvent} page */
		(page) => {
			// Update the frontmatter of the generated page.
			page.frontmatter = {
				// Include a sidebar badge with the text 'New'.
				topic: 'references',
				...page.frontmatter,
			};
		}
	);
}
