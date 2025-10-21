import { Effect } from '@withstudiocms/effect';
import * as allure from 'allure-js-commons';
import { describe, expect, test, vi } from 'vitest';
import { resolver } from '../../src/registry/handler.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Astro Handler Tests';

// Mock createResolver from astro-integration-kit
vi.mock('astro-integration-kit', async () => {
	return {
		createResolver: (base: string) => ({
			resolve: (...paths: string[]) => [base, ...paths].join('/'),
		}),
		defineUtility: () => () => {},
		addVirtualImports: vi.fn(),
	};
});

describe(parentSuiteName, () => {
	const basePath = '/base/path';

	test('Handler - resolver - returns Effect-wrapped resolver function that resolves paths correctly', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('resolver Tests');
		await allure.tags(...sharedTags);

		let resolveEffect: (
			fn: (resolve: (...path: Array<string>) => string) => string
		) => Effect.Effect.AsEffect<Effect.Effect<string, Error, never>>;

		await allure.step('Create resolver Effect', async () => {
			resolveEffect = await Effect.runPromise(resolver(basePath));
			expect(typeof resolveEffect).toBe('function');
		});

		await allure.step('Resolve a path using the resolver Effect', async () => {
			const result = await Effect.runPromise(
				resolveEffect((resolve) => resolve('component.astro'))
			);
			expect(result).toBe('/base/path/component.astro');
		});
	});

	test('Handler - resolver - Catches errors thrown in the callback and returns an Error', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('resolver Tests');
		await allure.tags(...sharedTags);

		await allure.step('Invoke resolver Effect with a callback that throws an error', async () => {
			const errorMsg = 'Test error';
			const resolveEffect = await Effect.runPromise(resolver(basePath));
			const result = await Effect.runPromise(
				Effect.exit(
					resolveEffect(() => {
						throw new Error(errorMsg);
					})
				)
			);
			expect(result._tag).toBe('Failure');

			const resultData = result.toJSON() as any;

			console.log(resultData);

			expect(resultData.cause.failure).toBeInstanceOf(Error);

			expect((resultData.cause.failure as unknown as Error).message).toBe(
				'Failed to resolve component'
			);
			expect((resultData.cause.failure as unknown as Error).cause).toBeInstanceOf(Error);
			// @ts-expect-error - this is a test
			expect((resultData.cause.failure as unknown as Error).cause?.message).toBe(errorMsg);
		});
	});

	test('Handler - resolver - passes correct resolve function to callback', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('resolver Tests');
		await allure.tags(...sharedTags);

		await allure.step('Get resolve function from resolver Effect and verify it works', async () => {
			const resolveEffect = await Effect.runPromise(resolver(basePath));
			const result = await Effect.runPromise(
				resolveEffect((resolve) => resolve('foo', 'bar.astro'))
			);
			expect(result).toBe('/base/path/foo/bar.astro');
		});
	});
});
