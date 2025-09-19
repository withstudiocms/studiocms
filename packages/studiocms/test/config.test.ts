import { describe, expect, expectTypeOf, it } from 'vitest';
import { defineStudioCMSConfig } from '../src/config';
import type { StudioCMSOptions } from '../src/schemas';

// Mock minimal StudioCMSOptions for testing
const minimalConfig: StudioCMSOptions = {
	dbStartPage: true,
};

const fullConfig: StudioCMSOptions = {
	dbStartPage: false,
	plugins: [],
	verbose: true,
	locale: {
		dateLocale: 'en-us',
	},
	features: {
		injectQuickActionsMenu: true,
	},
};

describe('defineStudioCMSConfig', () => {
	it('should return the config object unchanged', () => {
		const result = defineStudioCMSConfig(minimalConfig);
		expect(result).toBe(minimalConfig);
	});

	it('should preserve all properties of the config object', () => {
		const result = defineStudioCMSConfig(fullConfig);
		expect(result).toEqual(fullConfig);
	});

	it('should return StudioCMSOptions type', () => {
		const config = defineStudioCMSConfig({ dbStartPage: true });
		expectTypeOf(config).toEqualTypeOf<StudioCMSOptions>();
	});
});
