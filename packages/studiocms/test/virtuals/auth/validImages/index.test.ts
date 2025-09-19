import { describe, expect, it } from 'vitest';
import { validImages } from '../../../../src/virtuals/auth/validImages';

describe('validImages', () => {
	it('should export an array of valid images', () => {
		expect(Array.isArray(validImages)).toBe(true);
		expect(validImages.length).toBe(4);
	});

	it('should have correct structure for each image', () => {
		validImages.forEach((img) => {
			expect(typeof img.name).toBe('string');
			expect(typeof img.label).toBe('string');
			expect(['local', 'web']).toContain(img.format);
			// light and dark can be null or object
			expect(img.light === null || typeof img.light === 'object').toBe(true);
			expect(img.dark === null || typeof img.dark === 'object').toBe(true);
		});
	});

	it('should contain the expected image names', () => {
		const names = validImages.map((img) => img.name);
		expect(names).toEqual(['studiocms-blobs', 'studiocms-blocks', 'studiocms-curves', 'custom']);
	});

	it('should have "custom" image with format "web" and null light/dark', () => {
		const custom = validImages.find((img) => img.name === 'custom');
		expect(custom).toBeDefined();
		expect(custom?.format).toBe('web');
		expect(custom?.light).toBeNull();
		expect(custom?.dark).toBeNull();
	});

	it('should have non-null light/dark for local images', () => {
		validImages
			.filter((img) => img.format === 'local')
			.forEach((img) => {
				expect(img.light).not.toBeNull();
				expect(img.dark).not.toBeNull();
			});
	});
});
