import { toString as toStr } from 'hast-util-to-string';
import { h } from 'hastscript';
import { escape as esc } from 'html-escaper';
import type { Options as rehypeAutolinkHeadingsOptions } from 'rehype-autolink-headings';

/**
 * Rehype plugin config for autolinking headings. This configuration specifies how the `rehype-autolink-headings` plugin should generate anchor links for headings in the markdown content. The configuration includes properties for styling the anchor links, defining their behavior (e.g., whether they should appear before or after the heading), and grouping the heading and anchor link together in a wrapper element. Additionally, it defines the content of the anchor link, which includes an SVG icon and screen reader text for accessibility. This configuration ensures that headings in the markdown content are easily linkable and accessible to users.
 *
 * @returns A configuration object for the `rehype-autolink-headings` plugin, specifying how the anchor links should be generated and styled.
 */
export const rehypeAutolinkOptions: rehypeAutolinkHeadingsOptions = {
	properties: {
		class: 'anchor-link',
	},
	behavior: 'after',
	group: ({ tagName }) =>
		h('div', {
			tabIndex: -1,
			class: `heading-wrapper level-${tagName}`,
		}),
	content: (heading) => [
		h(
			'span',
			{ ariaHidden: 'true', class: 'anchor-icon' },
			h(
				'svg',
				{
					width: 16,
					height: 16,
					viewBox: '0 0 24 24',
					fill: 'none',
					stroke: 'currentColor',
					strokeWidth: 1.5,
				},
				h('path', {
					strokeLinecap: 'round',
					strokeLinejoin: 'round',
					d: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244',
				})
			)
		),
		h(
			'span',
			{ 'is:raw': true, class: 'sr-only' },
			`'Read the “', ${esc(toStr(heading))}, '” section'`
		),
	],
};
