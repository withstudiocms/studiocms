import { symbol as htmlSymbol } from '../src/lib/shared.js';
import type { HTMLSchemaOptions } from '../src/types.js';

export const parentSuiteName = '@studiocms/html Package Tests';
export const sharedTags = ['package:@studiocms/html', 'type:unit', 'scope:studiocms'];

/**
 * Mock HTML schema options for testing
 */
export const createMockHTMLOptions = (
	overrides: Partial<HTMLSchemaOptions> = {}
): HTMLSchemaOptions => ({
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
		[htmlSymbol]: {
			htmlConfig: undefined,
		},
	};

	// Mock globalThis
	Object.defineProperty(globalThis, htmlSymbol, {
		value: mockGlobal[htmlSymbol],
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
		if (String(s) === 'Symbol(@studiocms/html)') {
			delete (globalThis as Record<symbol, unknown>)[s];
		}
	}
};
