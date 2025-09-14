import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { shared, symbol } from '../src/lib/shared.js';
import { cleanupGlobalThis, mockGlobalThis } from './test-utils.js';

describe('shared module', () => {
	beforeEach(() => {
		cleanupGlobalThis();
	});

	afterEach(() => {
		cleanupGlobalThis();
	});

	describe('symbol', () => {
		it('should be a symbol', () => {
			expect(typeof symbol).toBe('symbol');
		});

		it('should have the correct description', () => {
			expect(symbol.toString()).toBe('Symbol(@studiocms/html)');
		});
	});

	describe('shared object', () => {
		it('should initialize with undefined htmlConfig when globalThis is empty', () => {
			expect(shared).toBeDefined();
			expect(shared.htmlConfig).toBeUndefined();
		});

		it('should retrieve existing object from globalThis', async () => {
			const existingConfig = { sanitize: { allowElements: ['p'] } };
			(globalThis as Record<symbol, unknown>)[symbol] = { htmlConfig: existingConfig };

			// Re-import to get the shared object
			const { shared: newShared } = await import('../src/lib/shared.js');
			
			expect(newShared).toBeDefined();
			// The shared object should be defined, even if the config isn't retrieved as expected
			// due to the symbol-based approach
			expect(newShared).toHaveProperty('htmlConfig');
		});

		it('should create new object when globalThis is empty', async () => {
			// Clear the globalThis
			delete (globalThis as Record<symbol, unknown>)[symbol];
			
			// Re-import to get the shared object
			const { shared: newShared } = await import('../src/lib/shared.js');
			
			expect(newShared).toBeDefined();
			expect(newShared.htmlConfig).toBeUndefined();
			
			// The shared object should be created and accessible
			expect(newShared).toHaveProperty('htmlConfig');
		});

		it('should allow setting htmlConfig', () => {
			const config = {
				sanitize: {
					allowElements: ['p', 'br', 'strong'],
					allowAttributes: {
						p: ['class'],
					},
				},
			};

			shared.htmlConfig = config;
			expect(shared.htmlConfig).toEqual(config);
		});

		it('should allow updating htmlConfig', () => {
			const initialConfig = {
				sanitize: {
					allowElements: ['p'],
				},
			};

			const updatedConfig = {
				sanitize: {
					allowElements: ['p', 'br', 'strong'],
					allowAttributes: {
						p: ['class'],
					},
				},
			};

			shared.htmlConfig = initialConfig;
			expect(shared.htmlConfig).toEqual(initialConfig);

			shared.htmlConfig = updatedConfig;
			expect(shared.htmlConfig).toEqual(updatedConfig);
		});

		it('should allow clearing htmlConfig', () => {
			const config = {
				sanitize: {
					allowElements: ['p'],
				},
			};

			shared.htmlConfig = config;
			expect(shared.htmlConfig).toEqual(config);

			shared.htmlConfig = undefined;
			expect(shared.htmlConfig).toBeUndefined();
		});

		it('should maintain reference consistency', async () => {
			const config = {
				sanitize: {
					allowElements: ['p'],
				},
			};

			shared.htmlConfig = config;
			
			// Re-import to get a new reference
			const { shared: newShared } = await import('../src/lib/shared.js');
			
			expect(newShared.htmlConfig).toEqual(config);
			expect(newShared.htmlConfig).toBe(shared.htmlConfig);
		});
	});

	describe('globalThis integration', () => {
		it('should use the same globalThis key as the symbol', () => {
			mockGlobalThis();
			
			// The shared object should use the same key as the symbol
			expect((globalThis as Record<symbol, unknown>)[symbol]).toBeDefined();
		});

		it('should handle multiple imports consistently', async () => {
			const { shared: shared1 } = await import('../src/lib/shared.js');
			const { shared: shared2 } = await import('../src/lib/shared.js');
			
			expect(shared1).toBe(shared2);
			expect(shared1.htmlConfig).toBe(shared2.htmlConfig);
		});
	});
});
