import assert from 'node:assert';
import { describe, it } from 'node:test';
import { Deepmerge, deepmerge } from '../dist/deepmerge.js';
import { Effect } from '../dist/effect.js';

describe('deepmerge test', () => {

	describe('deepmerge utility', () => {
		it('merges two simple objects', async () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { b: 3, c: 4 };

			const result = await Effect.runPromise(
				deepmerge((merge) => merge(obj1, obj2))
			);

			assert.deepStrictEqual(result, { a: 1, b: 3, c: 4 });
		});

		it('merges nested objects deeply', async () => {
			const obj1 = { a: { x: 1 }, b: 2 };
			const obj2 = { a: { y: 2 }, b: 3 };

			const result = await Effect.runPromise(
				deepmerge((merge) => merge(obj1, obj2))
			);

			assert.deepStrictEqual(result, { a: { x: 1, y: 2 }, b: 3 });
		});

		it('respects custom options', async () => {
			const obj1 = { arr: [1, 2] };
			const obj2 = { arr: [3, 4] };

			const result = await Effect.runPromise(
				deepmerge(
					(merge) => merge(obj1, obj2),
					{
						arrayMerge: (target, source) => [...target, ...source],
					}
				)
			);

			assert.deepStrictEqual(result, { arr: [1, 2, 3, 4] });
		});

		it('throws an error if the merge function throws', async () => {
			const errorFn = () => {
				throw new Error('Test error');
			};

			await assert.rejects(
				Effect.runPromise(deepmerge(() => errorFn())),
				{
					message: 'Failed to run deepmerge: Test error'
				}
			);
		});
	});

	describe('Deepmerge Effect Service', () => {
		it('provides a service for deep merging', async () => {
			const obj1 = { a: 1, b: 2 };
			const obj2 = { b: 3, c: 4 };

			const effect = Effect.gen(function* () {
				const service = yield* Deepmerge;
				return yield* service.merge((merge) => merge(obj1, obj2))
			}).pipe(Effect.provide(Deepmerge.Default));

			const result = await Effect.runPromise(effect);

			assert.deepStrictEqual(result, { a: 1, b: 3, c: 4 });
		});

		it('can handle complex nested structures', async () => {
			const obj1 = { a: { x: 1 }, b: [2, 3] };
			const obj2 = { a: { y: 2 }, b: [4, 5] };

			const effect = Effect.gen(function* () {
				const service = yield* Deepmerge;
				return yield* service.merge((merge) => merge(obj1, obj2))
			}).pipe(Effect.provide(Deepmerge.Default));

			const result = await Effect.runPromise(effect);

			assert.deepStrictEqual(result, { a: { x: 1, y: 2 }, b: [2, 3, 4, 5] });
		});

		it('throws an error if the service merge function throws', async () => {
			const errorFn = () => {
				throw new Error('Service test error');
			};

			const effect = Effect.gen(function* () {
				const service = yield* Deepmerge;
				return yield* service.merge(() => errorFn());
			}).pipe(Effect.provide(Deepmerge.Default));

			await assert.rejects(
				Effect.runPromise(effect),
				{
					message: 'Failed to run deepmerge: Service test error'
				}
			);
		});

		it('can be used with custom options', async () => {
			const obj1 = { arr: [1, 2] };
			const obj2 = { arr: [3, 4] };

			const effect = Effect.gen(function* () {
				const service = yield* Deepmerge;
				return yield* service.merge(
					(merge) => merge(obj1, obj2),
					{
						arrayMerge: (target, source) => [...target, ...source],
					}
				);
			}).pipe(Effect.provide(Deepmerge.Default));

			const result = await Effect.runPromise(effect);

			assert.deepStrictEqual(result, { arr: [1, 2, 3, 4] });
		});
	});

});
