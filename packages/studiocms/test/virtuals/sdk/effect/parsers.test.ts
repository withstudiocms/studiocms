import { Effect, Exit } from 'effect';
import { beforeAll, describe, expect, it } from 'vitest';
import { SDKCore_Parsers } from '../../../../src/virtuals/sdk/effect/parsers';
import { SDKCoreError, StudioCMS_SDK_Error } from '../../../../src/virtuals/sdk/errors';

const runEffect = async <A, E>(eff: Effect.Effect<A, E, never>) => await Effect.runPromiseExit(eff);

describe('SDKCore_Parsers', () => {
	let parsers: SDKCore_Parsers;

	beforeAll(async () => {
		parsers = await Effect.runPromise(
			SDKCore_Parsers.pipe(Effect.provide(SDKCore_Parsers.Default))
		);
	});

	describe('parseIdNumberArray', () => {
		it('parses valid array of numbers', async () => {
			const res = await runEffect(parsers.parseIdNumberArray([1, 2, 3]));
			expect(res).toEqual(Exit.succeed([1, 2, 3]));
		});

		it('fails on array with non-number', async () => {
			const res = await runEffect(parsers.parseIdNumberArray([1, '2', 3]));
			expect(res).toMatchObject(
				Exit.fail(
					new SDKCoreError({
						type: 'UNKNOWN',
						cause: new StudioCMS_SDK_Error(
							'parseIdNumberArray Error: Error: Expected an array of numbers'
						),
					})
				)
			);
		});

		it('fails on non-array input', async () => {
			const res = await runEffect(parsers.parseIdNumberArray('not-an-array'));
			expect(res).toMatchObject(
				Exit.fail(
					new SDKCoreError({
						type: 'UNKNOWN',
						cause: new StudioCMS_SDK_Error(
							'parseIdNumberArray Error: Error: Expected an array of numbers'
						),
					})
				)
			);
		});
	});

	describe('parseIdStringArray', () => {
		it('parses valid array of strings', async () => {
			const res = await runEffect(parsers.parseIdStringArray(['a', 'b', 'c']));
			expect(res).toEqual(Exit.succeed(['a', 'b', 'c']));
		});

		it('fails on array with non-string', async () => {
			const res = await runEffect(parsers.parseIdStringArray(['a', 2, 'c']));
			expect(res).toMatchObject(
				Exit.fail(
					new SDKCoreError({
						type: 'UNKNOWN',
						cause: new StudioCMS_SDK_Error(
							'parseIdStringArray Error: Error: Expected an array of strings'
						),
					})
				)
			);
		});

		it('fails on non-array input', async () => {
			const res = await runEffect(parsers.parseIdStringArray(123));
			expect(res).toMatchObject(
				Exit.fail(
					new SDKCoreError({
						type: 'UNKNOWN',
						cause: new StudioCMS_SDK_Error(
							'parseIdStringArray Error: Error: Expected an array of strings'
						),
					})
				)
			);
		});
	});

	describe('fixDiff', () => {
		it('parses pageMetaData for single diffItem', async () => {
			const diffItem = {
				id: 1,
				pageMetaData: JSON.stringify({
					start: { title: 'A' },
					end: { title: 'B' },
				}),
			};
			// @ts-expect-error Mocking partial type
			const res = await runEffect(parsers.fixDiff(diffItem));
			expect(res).toMatchObject(
				Exit.succeed({
					id: 1,
					pageMetaData: {
						start: { title: 'A' },
						end: { title: 'B' },
					},
				})
			);
		});

		it('parses pageMetaData for array of diffItems', async () => {
			const diffItems = [
				{
					id: 1,
					pageMetaData: JSON.stringify({ start: { title: 'A' }, end: { title: 'B' } }),
				},
				{
					id: 2,
					pageMetaData: JSON.stringify({ start: { title: 'C' }, end: { title: 'D' } }),
				},
			];
			// @ts-expect-error Mocking partial type
			const res = await Effect.runPromise(parsers.fixDiff(diffItems));
			expect(res).toHaveLength(2);
			// @ts-expect-error We know pageMetaData is parsed
			expect(res[0].pageMetaData).toMatchObject({ start: { title: 'A' }, end: { title: 'B' } });
			// @ts-expect-error We know pageMetaData is parsed
			expect(res[1].pageMetaData).toMatchObject({ start: { title: 'C' }, end: { title: 'D' } });
		});

		it('fails on invalid JSON in pageMetaData', async () => {
			const diffItem = {
				id: 1,
				pageMetaData: '{invalid-json}',
			};
			// @ts-expect-error Mocking partial type
			const res = await runEffect(parsers.fixDiff(diffItem));
			expect(res).toMatchObject(
				Exit.fail(
					new SDKCoreError({
						type: 'UNKNOWN',
						cause: new StudioCMS_SDK_Error(
							`fixDiff Error: SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)`
						),
					})
				)
			);
		});
	});
});
