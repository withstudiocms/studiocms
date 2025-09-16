import type { MDXPluginOptions } from '../src/types.js';

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
export const createMockMDXContent = (content = '# Hello World\n\nThis is a test MDX content.') => content;
