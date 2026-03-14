import type { MDXPluginOptions } from '../src/types.js';

export const parentSuiteName = '@studiocms/mdx Package Tests';
export const sharedTags = ['package:@studiocms/mdx', 'type:unit', 'scope:studiocms'];

/**
 * Mock MDX plugin options for testing
 */
export const createMockMDXOptions = (
	overrides: Partial<MDXPluginOptions> = {}
): MDXPluginOptions => ({
	remarkPlugins: [],
	rehypePlugins: [],
	recmaPlugins: [],
	remarkRehypeOptions: {},
	...overrides,
});

/**
 * Mock MDX content for testing
 */
export const createMockMDXContent = (content = '# Hello World\n\nThis is a test MDX content.') =>
	content;
