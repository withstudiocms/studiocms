import rehypeExternal from 'rehype-external-links';
import type { RehypePlugin } from './rehype.types';

// biome-ignore lint/suspicious/noExplicitAny: any is used to match the generic type
export const rehypeExternalLinks: [RehypePlugin, any] = [
	rehypeExternal,
	{
		content: {
			type: 'text',
			value: ' ⤴',
		},
		properties: {
			target: '_blank',
		},
		rel: ['noopener', 'noreferrer'],
	},
];

export default rehypeExternalLinks;
