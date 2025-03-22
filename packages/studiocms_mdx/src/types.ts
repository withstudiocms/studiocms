import type { EvaluateOptions } from '@mdx-js/mdx';
import type { PluggableList } from 'unified';

export interface MDXPluginOptions {
	remarkPlugins?: PluggableList;
	rehypePlugins?: PluggableList;
	recmaPlugins?: PluggableList;
	remarkRehypeOptions?: EvaluateOptions['remarkRehypeOptions'];
}
