import { describe, expect, it } from 'vitest';
import { FALLBACK_OG_IMAGE } from '../../src/components/consts.js';

describe('FALLBACK_OG_IMAGE', () => {
	it('should be defined', () => {
		expect(FALLBACK_OG_IMAGE).toBeDefined();
	});

	it('should be a string', () => {
		expect(typeof FALLBACK_OG_IMAGE).toBe('string');
	});

	it('should contain a valid Unsplash URL', () => {
		expect(FALLBACK_OG_IMAGE).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
	});

	it('should include query parameters for formatting', () => {
		expect(FALLBACK_OG_IMAGE).toContain('auto=format');
		expect(FALLBACK_OG_IMAGE).toContain('fit=crop');
	});
});
