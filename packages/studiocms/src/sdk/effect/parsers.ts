import { Effect } from 'effect';
import { jsonParse } from '../../utils/jsonParse.js';
import { SDKCoreError, StudioCMS_SDK_Error } from '../errors.js';
import type { DiffReturnType, diffItem, diffReturn, tsPageDataSelect } from '../types/index.js';

export class SDKCore_Parsers extends Effect.Service<SDKCore_Parsers>()(
	'studiocms/sdk/SDKCore_Parsers',
	{
		effect: Effect.gen(function* () {
			/**
			 * Parses an unknown input and casts it to an array of numbers.
			 *
			 * @param ids - The input to be parsed, expected to be an array of numbers.
			 * @returns An array of numbers.
			 */
			const parseIdNumberArray = (ids: unknown): Effect.Effect<number[], SDKCoreError, never> =>
				Effect.try({
					try: () => {
						if (!Array.isArray(ids) || !ids.every((n) => typeof n === 'number'))
							throw new Error('Expected an array of numbers');
						return ids as number[];
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`parseIdNumberArray Error: ${error}`),
						}),
				});

			/**
			 * Parses the given input as an array of strings.
			 *
			 * @param ids - The input to be parsed, expected to be an array of unknown type.
			 * @returns An array of strings parsed from the input.
			 */
			const parseIdStringArray = (ids: unknown): Effect.Effect<string[], SDKCoreError, never> =>
				Effect.try({
					try: () => {
						if (!Array.isArray(ids) || !ids.every((n) => typeof n === 'string'))
							throw new Error('Expected an array of strings');
						return ids as string[];
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`parseIdStringArray Error: ${error}`),
						}),
				});

			const fixDiff = <T extends diffItem | diffItem[]>(
				items: T
			): Effect.Effect<DiffReturnType<T>, SDKCoreError, never> =>
				Effect.try({
					try: () => {
						if (Array.isArray(items)) {
							const toReturn: diffReturn[] = [];
							for (const { pageMetaData, ...rest } of items) {
								toReturn.push({
									...rest,
									pageMetaData: jsonParse<{
										start: Partial<tsPageDataSelect>;
										end: Partial<tsPageDataSelect>;
									}>(pageMetaData as string),
								});
							}
							return toReturn as DiffReturnType<T>;
						}

						return {
							...items,
							pageMetaData: jsonParse<{
								start: Partial<tsPageDataSelect>;
								end: Partial<tsPageDataSelect>;
							}>(items.pageMetaData as string),
						} as DiffReturnType<T>;
					},
					catch: (error) =>
						new SDKCoreError({
							type: 'UNKNOWN',
							cause: new StudioCMS_SDK_Error(`fixDiff Error: ${error}`),
						}),
				});

			return {
				parseIdNumberArray,
				parseIdStringArray,
				fixDiff,
			};
		}),
		accessors: true,
	}
) {}
