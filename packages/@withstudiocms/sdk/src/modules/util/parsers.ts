import { Data, Effect, Schema } from '@withstudiocms/effect';
import type { DiffReturnType, diffItem, diffReturn, tsPageDataSelect } from '../../types.js';

/**
 * Error class for parser errors.
 */
export class ParsersError extends Data.TaggedError('ParsersError')<{ cause: unknown }> {}

/**
 * Utility function to handle errors in parser functions.
 *
 * @param _try - The function to execute that may throw an error.
 * @returns An effect that either yields the result of the function or a ParsersError.
 */
export const useParsersError = <T>(_try: () => T) =>
	Effect.try({
		try: _try,
		catch: (cause) => new ParsersError({ cause }),
	});

/**
 * SDKParsers
 *
 * Produces a collection of Effect-aware parser utilities used by the SDK.
 *
 * The returned object contains three helpers:
 * - parseIdNumberArray(ids): Parses an unknown value into an array of numbers using the
 *   SDK's NumberArraySchema and returns an Effect that yields the parsed array or a parse error.
 * - parseIdStringArray(ids): Parses an unknown value into an array of strings using the
 *   SDK's StringArraySchema and returns an Effect that yields the parsed array or a parse error.
 * - fixDiff(items): Accepts a single diff item or an array of diff items and returns an Effect
 *   that yields the same shape with the `pageMetaData` field parsed from a JSON string into an
 *   object shaped as { start: Partial<tsPageDataSelect>, end: Partial<tsPageDataSelect> }.
 *
 * @remarks
 * - Each helper is implemented as an Effect.fn so callers receive an Effect that encapsulates
 *   parsing work and errors.
 * - fixDiff uses JSON.parse on the pageMetaData field and wraps failures using the SDK's parser
 *   error handling, so JSON or schema parsing problems are surfaced as a ParsersError.
 * - The functions preserve all other fields on the diff items while only transforming pageMetaData.
 *
 * @typeParam T - For fixDiff: the input type, constrained to either a single diffItem or an array of diffItem.
 *
 * @returns An object with three properties:
 * - parseIdNumberArray: (ids: unknown) => Effect<..., number[], ...> — yields a number array on success.
 * - parseIdStringArray: (ids: unknown) => Effect<..., string[], ...> — yields a string array on success.
 * - fixDiff: <T extends diffItem | diffItem[]>(items: T) => Effect<..., DiffReturnType<T>, ...> —
 *   yields the input diff item(s) with parsed pageMetaData.
 *
 * @example
 * // (pseudo-code demonstrating usage in an Effect context)
 * const parsers = yield* SDKParsers;
 * const numbers = yield* parsers.parseIdNumberArray(someUnknown);
 * const fixed = yield* parsers.fixDiff(someDiffOrArray);
 */
export const SDKParsers = Effect.gen(function* () {
	/**
	 * Parses an unknown input and casts it to an array of numbers.
	 *
	 * @param ids - The unknown input to parse.
	 * @returns An effect that yields the parsed array of numbers or a parse error.
	 */
	const parseIdNumberArray = Effect.fn((ids: unknown) =>
		Schema.decodeUnknown(Schema.Array(Schema.Number))(ids)
	);

	/**
	 * Parses an unknown input and casts it to an array of strings.
	 *
	 * @param ids - The unknown input to parse.
	 * @returns An effect that yields the parsed array of strings or a parse error.
	 */
	const parseIdStringArray = Effect.fn((ids: unknown) =>
		Schema.decodeUnknown(Schema.Array(Schema.String))(ids)
	);

	/**
	 * Fixes the diff items by parsing the `pageMetaData` field.
	 *
	 * @param items - The diff items to be fixed, can be a single item or an array.
	 * @returns An effect that yields the fixed diff items or a ParsersError.
	 */
	const fixDiff = Effect.fn(<T extends diffItem | diffItem[]>(items: T) =>
		useParsersError(() => {
			if (Array.isArray(items)) {
				const toReturn: diffReturn[] = [];
				for (const { pageMetaData, ...rest } of items as diffItem[]) {
					toReturn.push({
						...rest,
						pageMetaData: pageMetaData as {
							start: tsPageDataSelect;
							end: tsPageDataSelect;
						},
					});
				}
				return toReturn as DiffReturnType<T>;
			}

			return {
				...items,
				pageMetaData: items.pageMetaData as {
					start: tsPageDataSelect;
					end: tsPageDataSelect;
				},
			} as DiffReturnType<T>;
		})
	);

	return {
		parseIdNumberArray,
		parseIdStringArray,
		fixDiff,
	};
});
