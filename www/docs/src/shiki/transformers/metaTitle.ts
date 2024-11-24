import { h } from 'hastscript';
import type { ShikiTransformer } from 'shiki';

export function parseMetaTitleWords(meta?: string): string[] {
	if (!meta) return [];

	// Regular expression to match title="word"
	const match = Array.from(meta.matchAll(/title="([^"]+)"/g));

	return match.map((v) => v[1]);
}

/**
 * Allow using `title=""` in the code snippet meta to mark highlighted words.
 */
export function metaTitle(): ShikiTransformer {
	return {
		name: 'shiki-transformer-meta-title',
		pre(node) {
			// If there is no title, return
			if (!this.options.meta?.__raw) return;

			// Get the possible titles
			const possibleTitles = parseMetaTitleWords(this.options.meta?.__raw);

			// If there are no titles, return
			if (possibleTitles.length === 0) return;

			// Get the first title
			const title = possibleTitles[0];

			// Create a span element with the title
			const span = h('span', { class: 'title' }, title);

			// Add the span to the node children
			node.children.push(span);
		},
	};
}

export default metaTitle;
