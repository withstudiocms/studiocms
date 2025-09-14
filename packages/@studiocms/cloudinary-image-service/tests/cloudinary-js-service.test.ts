import { beforeEach, describe, expect, it, vi } from 'vitest';
import cloudinaryImageService from '../src/cloudinary-js-service.js';

// Mock Astro environment
vi.mock('astro:env/server', () => ({
	getSecret: vi.fn(),
}));

// Mock Cloudinary SDK
vi.mock('@cloudinary/url-gen', () => ({
	Cloudinary: vi.fn(),
}));

// Mock Cloudinary actions
vi.mock('@cloudinary/url-gen/actions/resize', () => ({
	fill: vi.fn(),
}));

// Mock AstroError
vi.mock('astro/errors', () => ({
	AstroError: vi.fn().mockImplementation((message) => ({
		message,
		name: 'AstroError',
	})),
}));

import { getSecret } from 'astro:env/server';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';

describe('cloudinaryImageService', () => {
	const mockCloudName = 'test-cloud';
	const mockImageUrl =
		'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/test-image.jpg';

	type MockCldInstance = {
		image: ReturnType<typeof vi.fn>;
	};
	type MockImageInstance = {
		format: ReturnType<typeof vi.fn>;
		quality: ReturnType<typeof vi.fn>;
		resize: ReturnType<typeof vi.fn>;
		setDeliveryType: ReturnType<typeof vi.fn>;
		toURL: ReturnType<typeof vi.fn>;
	};
	type MockFillAction = {
		width: ReturnType<typeof vi.fn>;
		height: ReturnType<typeof vi.fn>;
	};

	let mockCldInstance: MockCldInstance;
	let mockImageInstance: MockImageInstance;
	let mockFillAction: MockFillAction;

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup mock instances
		mockImageInstance = {
			format: vi.fn().mockReturnThis(),
			quality: vi.fn().mockReturnThis(),
			resize: vi.fn().mockReturnThis(),
			setDeliveryType: vi.fn().mockReturnThis(),
			toURL: vi.fn().mockReturnValue(mockImageUrl),
		};

		mockFillAction = {
			width: vi.fn().mockReturnThis(),
			height: vi.fn().mockReturnThis(),
		};

		mockCldInstance = {
			image: vi.fn().mockReturnValue(mockImageInstance),
		};

		// Setup mocks
		vi.mocked(Cloudinary).mockImplementation(
			() => mockCldInstance as unknown as InstanceType<typeof Cloudinary>
		);
		vi.mocked(fill).mockReturnValue(mockFillAction as unknown as ReturnType<typeof fill>);
		vi.mocked(getSecret).mockReturnValue(mockCloudName);
	});

	describe('successful image generation', () => {
		it('should generate Cloudinary URL for local image', () => {
			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			expect(getSecret).toHaveBeenCalledWith('CMS_CLOUDINARY_CLOUDNAME');
			expect(Cloudinary).toHaveBeenCalledWith({
				cloud: {
					cloudName: mockCloudName,
				},
			});
			expect(mockCldInstance.image).toHaveBeenCalledWith(src);
			expect(mockImageInstance.format).toHaveBeenCalledWith('auto');
			expect(mockImageInstance.quality).toHaveBeenCalledWith('auto');
			expect(fill).toHaveBeenCalledWith('auto');
			expect(mockFillAction.width).toHaveBeenCalledWith(props.width);
			expect(mockFillAction.height).toHaveBeenCalledWith(props.height);
			expect(mockImageInstance.resize).toHaveBeenCalledWith(mockFillAction);
			expect(mockImageInstance.toURL).toHaveBeenCalled();
			expect(result).toBe(mockImageUrl);
		});

		it('should generate Cloudinary URL for external HTTPS image', () => {
			const src = 'https://example.com/external-image.jpg';
			const props = { width: 100, height: 100, alt: 'External image' };
			const result = cloudinaryImageService(src, props);

			expect(mockCldInstance.image).toHaveBeenCalledWith(src);
			expect(mockImageInstance.setDeliveryType).toHaveBeenCalledWith('fetch');
			expect(result).toBe(mockImageUrl);
		});

		it('should generate Cloudinary URL for external HTTP image', () => {
			const src = 'http://example.com/external-image.jpg';
			const props = { width: 100, height: 100, alt: 'HTTP image' };
			const result = cloudinaryImageService(src, props);

			expect(mockCldInstance.image).toHaveBeenCalledWith(src);
			expect(mockImageInstance.setDeliveryType).toHaveBeenCalledWith('fetch');
			expect(result).toBe(mockImageUrl);
		});

		it('should handle different image dimensions', () => {
			const src = 'test-image.jpg';
			const props = { width: 200, height: 300, alt: 'Different dimensions' };
			cloudinaryImageService(src, props);

			expect(mockFillAction.width).toHaveBeenCalledWith(200);
			expect(mockFillAction.height).toHaveBeenCalledWith(300);
		});
	});

	describe('error handling', () => {
		it('should return original src when CMS_CLOUDINARY_CLOUDNAME is not set', () => {
			vi.mocked(getSecret).mockReturnValue(undefined);
			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			expect(result).toBe(src);
		});

		it('should return original src when CMS_CLOUDINARY_CLOUDNAME is empty string', () => {
			vi.mocked(getSecret).mockReturnValue('');
			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			expect(result).toBe(src);
		});

		it('should return original src when Cloudinary throws error', () => {
			vi.mocked(Cloudinary).mockImplementation(() => {
				throw new Error('Cloudinary init error');
			});
			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			expect(result).toBe(src);
		});

		it('should return original src when image processing throws error', () => {
			mockImageInstance.toURL.mockImplementation(() => {
				throw new Error('Image processing error');
			});
			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			expect(result).toBe(src);
		});
	});

	describe('edge cases', () => {
		it('should handle zero dimensions', () => {
			const src = 'test-image.jpg';
			const props = { width: 0, height: 0, alt: 'Zero dimensions' };
			const result = cloudinaryImageService(src, props);

			expect(result).toBe(mockImageUrl);
			expect(fill).toHaveBeenCalledWith('auto');
		});

		it('should handle very large dimensions', () => {
			const src = 'test-image.jpg';
			const props = { width: 10000, height: 10000, alt: 'Large dimensions' };
			const result = cloudinaryImageService(src, props);

			expect(result).toBe(mockImageUrl);
			expect(fill).toHaveBeenCalledWith('auto');
		});

		it('should handle special characters in image source', () => {
			const src = 'test-image with spaces & symbols!.jpg';
			const props = { width: 100, height: 100, alt: 'Special chars' };
			const result = cloudinaryImageService(src, props);

			expect(mockCldInstance.image).toHaveBeenCalledWith(src);
			expect(result).toBe(mockImageUrl);
		});

		it('should handle very long URLs', () => {
			const longUrl = `https://example.com/${'a'.repeat(1000)}.jpg`;
			const props = { width: 100, height: 100, alt: 'Long URL' };
			const result = cloudinaryImageService(longUrl, props);

			expect(mockCldInstance.image).toHaveBeenCalledWith(longUrl);
			expect(mockImageInstance.setDeliveryType).toHaveBeenCalledWith('fetch');
			expect(result).toBe(mockImageUrl);
		});
	});
});
