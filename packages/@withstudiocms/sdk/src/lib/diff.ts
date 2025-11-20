import { Data, Effect } from '@withstudiocms/effect';
import { createTwoFilesPatch as diffCreateTwoFilesPatch } from 'diff';
import { type Diff2HtmlConfig, html } from 'diff2html';

/**
 * Custom error class for diff-related operations in the SDK.
 */
export class DiffError extends Data.TaggedError('DiffError')<{ cause: unknown }> {}

/**
 * Helper function to wrap diff-related operations with error handling.
 *
 * @param _try - A function that performs the desired operation.
 * @returns An Effect that either succeeds with the result of the operation or fails with a DiffError.
 */
const useDiffError = <T>(_try: () => T) =>
	Effect.try({
		try: _try,
		catch: (error) => new DiffError({ cause: error }),
	});

/**
 * Creates a unified diff patch between two text inputs.
 *
 * @param oldStr - The original text.
 * @param newStr - The modified text.
 * @param fileNameOld - The name of the original file (default: 'OldFile').
 * @param fileNameNew - The name of the modified file (default: 'NewFile').
 * @returns An Effect that resolves to the unified diff string.
 */
export const createTwoFilesPatch = Effect.fn(
	<T>(fn: (patch: typeof diffCreateTwoFilesPatch) => T) =>
		useDiffError(() => fn(diffCreateTwoFilesPatch))
);

/**
 * Generates an HTML representation of the differences between two text inputs.
 *
 * @param diff - The unified diff string.
 * @param options - Optional configuration for the diff HTML output.
 * @returns An Effect that resolves to the HTML string representing the diff.
 */
export const diffHTML = Effect.fn((diff: string, options?: Diff2HtmlConfig) =>
	useDiffError(() =>
		html(diff, {
			diffStyle: 'word',
			matching: 'lines',
			drawFileList: false,
			outputFormat: 'side-by-side',
			...options,
		})
	)
);
