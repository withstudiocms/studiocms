import * as allure from 'allure-js-commons';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import cloudinaryImageService from '../src/cloudinary-js-service.js';
import { parentSuiteName, sharedTags } from './test-utils.js';

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

const localSuiteName = 'Cloudinary Image Service - Image URL Generation Tests';

describe(parentSuiteName, () => {
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

	test('should generate Cloudinary URL for local image', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Image URL Generation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Generating Cloudinary URL for local image', async (ctx) => {
			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			await ctx.parameter('Image Source', src);
			await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
			await ctx.parameter('Generated URL', await result);

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
	});

	[
		{
			input: 'https://example.com/external-image.jpg',
			description: 'external HTTPS image',
		},
		{
			input: 'http://example.com/external-image.jpg',
			description: 'external HTTP image',
		},
	].forEach(({ input, description }) => {
		test(`should generate Cloudinary URL for ${description}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Image URL Generation Tests');
			await allure.tags(...sharedTags);

			await allure.step(`Generating Cloudinary URL for ${description}`, async (ctx) => {
				const src = input;
				const props = { width: 100, height: 100, alt: 'Test image' };
				const result = cloudinaryImageService(src, props);

				await ctx.parameter('Image Source', src);
				await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
				await ctx.parameter('Generated URL', await result);

				expect(mockCldInstance.image).toHaveBeenCalledWith(src);
				expect(mockImageInstance.setDeliveryType).toHaveBeenCalledWith('fetch');
				expect(result).toBe(mockImageUrl);
			});
		});
	});

	test('should handle different image dimensions', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Image URL Generation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Generating Cloudinary URL with different dimensions', async (ctx) => {
			const src = 'test-image.jpg';
			const props = { width: 200, height: 300, alt: 'Different dimensions' };
			const result = cloudinaryImageService(src, props);

			await ctx.parameter('Image Source', src);
			await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
			await ctx.parameter('Generated URL', await result);

			expect(result).toBe(mockImageUrl);
			expect(mockFillAction.width).toHaveBeenCalledWith(200);
			expect(mockFillAction.height).toHaveBeenCalledWith(300);
		});
	});

	test('Should return original src if CMS_CLOUDINARY_CLOUDNAME is not set', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Image URL Generation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Generating Cloudinary URL without cloud name set', async (ctx) => {
			vi.mocked(getSecret).mockReturnValue(undefined);

			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			await ctx.parameter('Image Source', src);
			await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
			await ctx.parameter('Generated URL', await result);

			expect(getSecret).toHaveBeenCalledWith('CMS_CLOUDINARY_CLOUDNAME');
			expect(result).toBe(src);
		});
	});

	test('Should return original src when cloud name is empty string', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Image URL Generation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Generating Cloudinary URL with empty cloud name', async (ctx) => {
			vi.mocked(getSecret).mockReturnValue('');

			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			await ctx.parameter('Image Source', src);
			await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
			await ctx.parameter('Generated URL', await result);

			expect(getSecret).toHaveBeenCalledWith('CMS_CLOUDINARY_CLOUDNAME');
			expect(result).toBe(src);
		});
	});

	test('Should return original src when Cloudinary throws an error', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Image URL Generation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Generating Cloudinary URL with Cloudinary error', async (ctx) => {
			vi.mocked(Cloudinary).mockImplementation(() => {
				throw new Error('Cloudinary init error');
			});

			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			await ctx.parameter('Image Source', src);
			await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
			await ctx.parameter('Generated URL', await result);

			expect(getSecret).toHaveBeenCalledWith('CMS_CLOUDINARY_CLOUDNAME');
			expect(result).toBe(src);
		});
	});

	test('Should return original src when image processing throws an error', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Image URL Generation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Generating Cloudinary URL with image processing error', async (ctx) => {
			mockImageInstance.toURL.mockImplementation(() => {
				throw new Error('Image processing error');
			});

			const src = 'test-image.jpg';
			const props = { width: 100, height: 100, alt: 'Test image' };
			const result = cloudinaryImageService(src, props);

			await ctx.parameter('Image Source', src);
			await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
			await ctx.parameter('Generated URL', await result);

			expect(getSecret).toHaveBeenCalledWith('CMS_CLOUDINARY_CLOUDNAME');
			expect(result).toBe(src);
		});
	});

	[
		{
			props: { width: 0, height: 0, alt: 'Zero dimensions' },
		},
		{
			props: { width: 10000, height: 10000, alt: 'Large dimensions' },
		},
	].forEach(({ props }) => {
		test(`should handle edge case dimensions: width=${props.width}, height=${props.height}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('Image URL Generation Tests');
			await allure.tags(...sharedTags);

			await allure.step('Generating Cloudinary URL with edge case dimensions', async (ctx) => {
				const src = 'test-image.jpg';
				const result = cloudinaryImageService(src, props);

				await ctx.parameter('Image Source', src);
				await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
				await ctx.parameter('Generated URL', await result);

				expect(result).toBe(mockImageUrl);
				expect(fill).toHaveBeenCalledWith('auto');
			});
		});
	});

	test('should handle special characters in image source', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Image URL Generation Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'Generating Cloudinary URL with special characters in source',
			async (ctx) => {
				const src = 'test-image with spaces & symbols!.jpg';
				const props = { width: 100, height: 100, alt: 'Special chars' };
				const result = cloudinaryImageService(src, props);

				await ctx.parameter('Image Source', src);
				await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
				await ctx.parameter('Generated URL', await result);

				expect(mockCldInstance.image).toHaveBeenCalledWith(src);
				expect(result).toBe(mockImageUrl);
			}
		);
	});

	test('should handle very long URLs', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('Image URL Generation Tests');
		await allure.tags(...sharedTags);

		await allure.step('Generating Cloudinary URL with very long URL', async (ctx) => {
			const longUrl = `https://example.com/${'a'.repeat(1000)}.jpg`;
			const props = { width: 100, height: 100, alt: 'Long URL' };
			const result = cloudinaryImageService(longUrl, props);

			await ctx.parameter('Image Source', longUrl);
			await ctx.parameter('Image Properties', JSON.stringify(props, null, 2));
			await ctx.parameter('Generated URL', await result);

			expect(mockCldInstance.image).toHaveBeenCalledWith(longUrl);
			expect(mockImageInstance.setDeliveryType).toHaveBeenCalledWith('fetch');
			expect(result).toBe(mockImageUrl);
		});
	});
});
