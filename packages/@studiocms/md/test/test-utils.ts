import { symbol as mdSymbol } from '../src/lib/shared.js';
import type { StudioCMSMarkdownOptions } from '../src/types.js';

export const parentSuiteName = '@studiocms/md Package Tests';
export const sharedTags = ['package:@studiocms/md', 'type:unit', 'scope:studiocms'];

/**
 * Mock StudioCMS Markdown schema options for testing
 */
export const createMockMarkdownOptions = (
	overrides: Partial<StudioCMSMarkdownOptions> = {}
): StudioCMSMarkdownOptions => ({
	callouts: 'obsidian',
	autoLinkHeadings: true,
	discordSubtext: true,
	sanitize: {
		allowElements: [],
		allowAttributes: {},
	},
	...overrides,
});

/**
 * Clean up globalThis after tests
 */
export const cleanupGlobalThis = () => {
	// Remove the symbol-keyed slot if present
	delete (globalThis as Record<symbol, unknown>)[mdSymbol];
};
