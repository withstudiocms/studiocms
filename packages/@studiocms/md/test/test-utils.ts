import { symbol as mdSymbol } from '../src/lib/shared.js';
import type { AstroMarkdownOptions, StudioCMSMarkdownOptions } from '../src/types.js';

/**
 * Mock StudioCMS Markdown schema options for testing
 */
export const createMockMarkdownOptions = (
	overrides: Partial<StudioCMSMarkdownOptions> = {}
): StudioCMSMarkdownOptions => ({
	flavor: 'studiocms',
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
 * Mock Astro-flavored Markdown options for testing
 */
export const createMockAstroMarkdownOptions = (
	overrides: Partial<AstroMarkdownOptions> = {}
): AstroMarkdownOptions => ({
	flavor: 'astro',
	sanitize: {
		allowElements: [],
		allowAttributes: {},
	},
	...overrides,
});

/**
 * Mock globalThis for shared module testing
 */
export const mockGlobalThis = () => {
	const mockGlobal = {
		[mdSymbol]: {
			mdConfig: undefined,
			astroMDRemark: undefined,
		},
	};

	// Mock globalThis
	Object.defineProperty(globalThis, mdSymbol, {
		value: mockGlobal[mdSymbol],
		writable: true,
		configurable: true,
	});

	return mockGlobal;
};

/**
 * Clean up globalThis after tests
 */
export const cleanupGlobalThis = () => {
	// symbol-keyed property
	const syms = Object.getOwnPropertySymbols(globalThis);
	for (const s of syms) {
		if (String(s) === 'Symbol(@studiocms/md)') {
			delete (globalThis as Record<symbol, unknown>)[s];
		}
	}
};
