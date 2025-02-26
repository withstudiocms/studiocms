import { toString as toStr } from 'hast-util-to-string';
import { h } from 'hastscript';
import { escape as esc } from 'html-escaper';
import rehypeAutoLink from 'rehype-autolink-headings';
import type { Options as rehypeAutolinkHeadingsOptions } from 'rehype-autolink-headings';
import type { RehypePlugin } from './rehype.types.ts';

const AnchorLinkIcon = h(
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
);

const createSROnlyLabel = (text: string) => {
	return h('span', { 'is:raw': true, class: 'sr-only' }, `'Read the “', ${esc(text)}, '” section'`);
};

export { AnchorLinkIcon, createSROnlyLabel };

// biome-ignore lint/suspicious/noExplicitAny: any is used to match the generic type
export const rehypeAutolinkHeadings: [RehypePlugin, any] = [
	rehypeAutoLink,
	{
		properties: {
			class: 'anchor-link',
		},
		behavior: 'after',
		group: ({ tagName }) =>
			h('div', {
				tabIndex: -1,
				class: `heading-wrapper level-${tagName}`,
			}),
		content: (heading) => [AnchorLinkIcon, createSROnlyLabel(toStr(heading))],
	} as rehypeAutolinkHeadingsOptions,
];

export default rehypeAutolinkHeadings;
