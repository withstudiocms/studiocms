import { Effect } from '@withstudiocms/effect';
import { type ClackError, log } from '@withstudiocms/effect/clack';
import chalk from 'chalk';

/**
 * Validates user input and re-prompts if validation fails.
 *
 * This function continuously prompts the user for input and validates it using the provided
 * check effect. If the input is invalid, an error message is logged and the user is prompted
 * again. The loop continues until valid input is received or a symbol (e.g., cancellation) is returned.
 *
 * @param opts - Configuration options for validation and prompting
 * @param opts.prompt - An Effect that yields the user's input or a symbol (e.g., cancel signal)
 * @param opts.checkEffect - A function that validates the input string. Returns `true` if valid,
 * or a string error message if invalid
 *
 * @returns An Effect that yields either the validated input string or a symbol if the prompt was cancelled
 *
 * @example
 * ```typescript
 * const validatedInput = yield* validateInputOrRePrompt({
 *   prompt: clack.text({ message: 'Enter your name:' }),
 *   checkEffect: (input) => Effect.succeed(
 *     input.length > 0 ? true : 'Name cannot be empty'
 *   )
 * });
 * ```
 */
export const validateInputOrRePrompt = Effect.fn('validateInputOrRePrompt')(function* (opts: {
	prompt: Effect.Effect<string | symbol, ClackError, never>;
	checkEffect: (input: string) => Effect.Effect<string | boolean, never, never>;
}): Effect.fn.Return<string | symbol, ClackError, never> {
	const { prompt, checkEffect } = opts;

	while (true) {
		// Run prompt to get user input
		const input = yield* prompt;

		// If input is a symbol (e.g., cancel), return it
		if (typeof input === 'symbol') {
			return input;
		}

		// Validate the input using the provided check effect
		const checkResult = yield* checkEffect(input);

		// If validation passes, return the valid input
		if (checkResult === true) {
			return input;
		}

		// If validation fails, log the error and re-prompt
		yield* log.error(chalk.red(`Invalid input: ${checkResult}`));
	}
});
