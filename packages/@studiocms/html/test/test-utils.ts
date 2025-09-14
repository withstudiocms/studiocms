import type { StudioCMSPlugin } from 'studiocms/plugins';
import { vi } from 'vitest';

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
export const createMockHTMLOptions = (overrides = {}) => ({
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
		'@studiocms/html': {
			htmlConfig: undefined,
		},
	};
	
	// Mock globalThis
	Object.defineProperty(globalThis, '@studiocms/html', {
		value: mockGlobal['@studiocms/html'],
		writable: true,
		configurable: true,
	});
	
	return mockGlobal;
};

/**
 * Clean up globalThis after tests
 */
export const cleanupGlobalThis = () => {
	delete (globalThis as Record<string, unknown>)['@studiocms/html'];
};
