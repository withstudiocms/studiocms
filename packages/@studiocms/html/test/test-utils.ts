import type { StudioCMSPlugin } from 'studiocms/plugins';
import { vi } from 'vitest';
import { symbol as htmlSymbol } from '../src/lib/shared.js';
import type { HTMLSchemaOptions } from '../src/types.js';

/**
 * Mock StudioCMS plugin hooks for testing
 */
export const createMockStudioCMSPlugin = (): StudioCMSPlugin => ({
	identifier: '@studiocms/html',
	name: 'StudioCMS HTML',
	studiocmsMinimumVersion: '0.1.0-beta.21',
	hooks: {
		'studiocms:astro:config': vi.fn(),
		'studiocms:config:setup': vi.fn(),
	},
});

/**
 * Mock Astro integration hooks
 */
export const createMockAstroIntegration = () => ({
	name: '@studiocms/html',
	hooks: {
		'astro:config:done': vi.fn(),
	},
});

/**
 * Mock HTML schema options for testing
 */
export const createMockHTMLOptions = (overrides: Partial<HTMLSchemaOptions> = {}): HTMLSchemaOptions => ({
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
