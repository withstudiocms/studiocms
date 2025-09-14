import { Effect } from '@withstudiocms/effect';
import { describe, expect, it, vi } from 'vitest';
import { resolver } from '../../src/registry/handler.js';

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

describe('resolver', () => {
	const basePath = '/base/path';

	it('returns an Effect-wrapped resolver that resolves paths correctly', async () => {
		const resolveEffect = await Effect.runPromise(resolver(basePath));
		const result = await Effect.runPromise(resolveEffect((resolve) => resolve('component.astro')));
		expect(result).toBe('/base/path/component.astro');
	});

	it('catches errors thrown in the callback and returns an Error', async () => {
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

		// biome-ignore lint/suspicious/noExplicitAny: allow any for testing
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

	it('passes the correct resolve function to the callback', async () => {
		const resolveEffect = await Effect.runPromise(resolver(basePath));
		const result = await Effect.runPromise(resolveEffect((resolve) => resolve('foo', 'bar.astro')));
		expect(result).toBe('/base/path/foo/bar.astro');
	});
});
