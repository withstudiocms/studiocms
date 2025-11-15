import { describe, expect } from 'vitest';
import { validImages } from '../../../../src/virtuals/auth/validImages';
import { allureTester } from '../../../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../../../test-utils';

const localSuiteName = 'validImages Virtual tests';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('validImages exports correct array structure', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'validImages tests',
			tags: [...sharedTags, 'virtual:auth', 'function:validImages'],
		});

		await step('Checking validImages array structure and contents', async () => {
			expect(Array.isArray(validImages)).toBe(true);
			expect(validImages.length).toBeGreaterThan(0);

			validImages.forEach((img) => {
				expect(typeof img.name).toBe('string');
				expect(typeof img.label).toBe('string');
				expect(['local', 'web']).toContain(img.format);
				// light and dark can be null or object
				expect(img.light === null || typeof img.light === 'object').toBe(true);
				expect(img.dark === null || typeof img.dark === 'object').toBe(true);
			});
		});
	});

	validImages.forEach(({ name }) => {
		test(`should have a valid entry for image name: ${name}`, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'validImages individual entry tests',
				tags: [...sharedTags, 'virtual:auth', 'function:validImages'],
			});

			await step(`Validating entry for image name: ${name}`, async () => {
				expect(name).toBeOneOf([
					'studiocms-blobs',
					'studiocms-blocks',
					'studiocms-curves',
					'custom',
				]);
			});
		});
	});

	test('validImage should have "custom" image with format "web"', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'validImages custom image tests',
			tags: [...sharedTags, 'virtual:auth', 'function:validImages'],
		});

		await step('Checking "custom" image entry', async () => {
			const customImage = validImages.find((img) => img.name === 'custom');
			expect(customImage).toBeDefined();
			expect(customImage?.format).toBe('web');
			expect(customImage?.light).toBeNull();
			expect(customImage?.dark).toBeNull();
		});
	});

	validImages
		.filter((img) => img.format === 'local')
		.forEach((img) => {
			test(`validImage "${img.name}" should have non-null light and dark properties`, async ({
				setupAllure,
				step,
			}) => {
				await setupAllure({
					subSuiteName: 'validImages local image light/dark tests',
					tags: [...sharedTags, 'virtual:auth', 'function:validImages'],
				});

				await step(`Checking light/dark properties for image: ${img.name}`, async () => {
					expect(img.light).not.toBeNull();
					expect(img.dark).not.toBeNull();
				});
			});
		});
});
