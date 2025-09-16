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

/**
 * Mock React component for testing MDX rendering
 */
export const createMockReactComponent = (name = 'TestComponent') => {
	return `import React from 'react';

export const ${name} = ({ children }: { children: React.ReactNode }) => {
	return <div className="test-component">{children}</div>;
};`;
};

/**
 * Clean up global state after tests
 */
export const cleanupGlobalState = () => {
	// Clean up any global state if needed
	// This can be extended based on what the MDX plugin stores globally
};

/**
 * Mock MDX evaluation result
 */
export const createMockMDXEvaluationResult = (content: string) => ({
	default: () => content,
});

/**
 * Mock React render result
 */
export const createMockReactRenderResult = (html: string) => html;