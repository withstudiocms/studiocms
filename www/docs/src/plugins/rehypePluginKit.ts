import rehypeSlug from 'rehype-slug';
import type { RehypePlugins } from './rehype.types';
import rehypeAutolinkHeadings from './rehypeAutolink';
import rehypeExternalLinks from './rehypeExternalLinks';

export const rehypePluginKit: RehypePlugins = [
	rehypeSlug,
	rehypeAutolinkHeadings,
	rehypeExternalLinks,
];

export default rehypePluginKit;
