import rehypeSlug from 'rehype-slug';
import type { RehypePlugins } from './rehype.types.ts';
import rehypeAutolinkHeadings from './rehypeAutolink.ts';
import rehypeExternalLinks from './rehypeExternalLinks.ts';

export const rehypePluginKit: RehypePlugins = [
	rehypeSlug,
	rehypeAutolinkHeadings,
	rehypeExternalLinks,
];

export default rehypePluginKit;
