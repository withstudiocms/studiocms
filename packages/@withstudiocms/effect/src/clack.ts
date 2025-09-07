import type {
	ClackSettings,
	ConfirmOptions,
	GroupMultiSelectOptions,
	LogMessageOptions,
	MultiSelectOptions,
	PasswordOptions,
	PromptGroup,
	PromptGroupOptions,
	SelectOptions,
	SpinnerOptions,
	Task,
	TextOptions,
} from '@clack/prompts';
import * as ClackPrompts from '@clack/prompts';
import { deepmerge } from './deepmerge.js';
import { Data, Effect } from './effect.js';

export type {
	ClackSettings,
	ConfirmOptions,
	GroupMultiSelectOptions,
	LogMessageOptions,
	MultiSelectOptions,
	Option,
	PasswordOptions,
	PromptGroup,
	PromptGroupAwaitedReturn,
	PromptGroupOptions,
	SelectOptions,
	SpinnerOptions,
	Task,
	TextOptions,
} from '@clack/prompts';

/**
 * Represents a custom error type for Clack-related operations.
 * Extends a tagged error with the tag 'ClackError' and includes an optional cause.
 *
 * @extends Data.TaggedError
 * @template { cause: unknown } - The shape of the error details.
 *
 * @example
 * throw new ClackError({ cause: someError });
 */
export class ClackError extends Data.TaggedError('ClackError')<{ cause: unknown }> {}

/**
 * Executes a function within an Effect, capturing any thrown errors and wrapping them in a `ClackError`.
 *
 * @template A - The type of the value returned by the function.
 * @param _try - A function to execute that may throw an error.
 * @returns An `Effect` that yields the result of the function or a `ClackError` if an error is thrown.
 */
const useClackError = <A>(_try: () => A): Effect.Effect<A, ClackError> =>
	Effect.try({
		try: _try,
		catch: (cause) => new ClackError({ cause }),
	});

/**
 * Wraps a promise-returning function in an Effect, mapping any thrown error to a `ClackError`.
 *
 * @template A The type of the resolved value of the promise.
 * @param _try A function that returns a promise of type `A`.
 * @returns An `Effect` that resolves with the value of type `A` or fails with a `ClackError`.
 */
const useClackErrorPromise = <A>(_try: () => Promise<A>): Effect.Effect<A, ClackError> =>
	Effect.tryPromise({
		try: _try,
		catch: (cause) => new ClackError({ cause }),
	});

/**
 * Cancels the current Clack operation and optionally displays an error message.
 *
 * This function wraps the `clackCancel` operation with error handling using `useClackError`.
 *
 * @param message - Optional error message to display when cancelling the operation.
 * @returns An Effect representing the cancellation operation.
 */
export const cancel = Effect.fn((message?: string) =>
	useClackError(() => ClackPrompts.cancel(message))
);

/**
 * Prompts the user for confirmation using the Clack UI and handles errors with `useClackError`.
 *
 * @param options - The configuration options for the confirmation prompt.
 * @returns An Effect that resolves to the user's confirmation response.
 */
export const confirm = Effect.fn((options: ConfirmOptions) =>
	useClackErrorPromise(() => ClackPrompts.confirm(options))
);

/**
 * Groups multiple prompts together and executes them as a single operation.
 * Utilizes error handling via `useClackError` to wrap the `clackGroup` execution.
 *
 * @typeParam T - The type of the data returned by the prompt group.
 * @param prompts - The group of prompts to be executed.
 * @param opts - Optional configuration options for the prompt group.
 * @returns The result of the grouped prompts, with error handling applied.
 */
export const group = <T>(prompts: PromptGroup<T>, opts?: PromptGroupOptions<T>) =>
	useClackErrorPromise(() => ClackPrompts.group(prompts, opts));

/**
 * Wraps the `clackGroupMultiselect` function with error handling using `useClackError`.
 *
 * @template T - The type of the selectable items.
 * @param options - The configuration options for the group multi-select prompt.
 * @returns The result of the group multi-select operation, with error handling applied.
 */
export const groupMultiselect = <T>(options: GroupMultiSelectOptions<T>) =>
	useClackErrorPromise(() => ClackPrompts.groupMultiselect(options));

/**
 * Displays an introductory message using the Clack library within an Effect context.
 *
 * @param message - The message to display as an introduction.
 * @returns An Effect that, when executed, shows the intro message and handles any Clack-related errors.
 */
export const intro = Effect.fn((message: string) =>
	useClackError(() => ClackPrompts.intro(message))
);

/**
 * Determines if the provided value represents a cancellation event.
 *
 * This function wraps the `clackIsCancel` utility with error handling via `useClackError`.
 * It is useful for checking if a value indicates a user-initiated cancellation in Clack-based workflows.
 *
 * @param value - The value to check for cancellation.
 * @returns `true` if the value represents a cancellation, otherwise `false`.
 */
export const isCancel = Effect.fn((value: unknown) =>
	useClackError(() => ClackPrompts.isCancel(value))
);

/**
 * Presents a multi-select prompt to the user with error handling.
 *
 * @typeParam T - The type of the selectable options.
 * @param options - The configuration options for the multi-select prompt.
 * @returns The result of the multi-select prompt, wrapped with error handling.
 */
export const multiselect = <T>(options: MultiSelectOptions<T>) =>
	useClackErrorPromise(() => ClackPrompts.multiselect(options));

/**
 * Displays a note message using the Clack notification system.
 *
 * @param message - Optional message to display in the note.
 * @param title - Optional title for the note.
 * @returns An Effect that triggers the note display, handling any Clack errors.
 */
export const note = Effect.fn((message?: string, title?: string) =>
	useClackError(() => ClackPrompts.note(message, title))
);

/**
 * Displays an outro message using the Clack library, handling any errors that may occur.
 *
 * @param message - Optional message to display as the outro.
 * @returns An Effect that executes the outro logic with error handling.
 */
export const outro = Effect.fn((message?: string) =>
	useClackError(() => ClackPrompts.outro(message))
);

/**
 * Prompts the user for a password input using the Clack library, with error handling.
 *
 * @param options - Configuration options for the password prompt.
 * @returns The result of the password prompt, potentially wrapped with error handling.
 *
 * @remarks
 * This function wraps the `clackPassword` prompt with `useClackError` to provide consistent error handling.
 */
export const password = (options: PasswordOptions) =>
	useClackErrorPromise(() => ClackPrompts.password(options));

/**
 * Presents a selection prompt to the user using Clack, handling errors gracefully.
 *
 * @typeParam T - The type of the selectable options.
 * @param options - The configuration options for the selection prompt.
 * @returns The selected option of type `T`.
 */
export const select = <T>(options: SelectOptions<T>) =>
	useClackErrorPromise(() => ClackPrompts.select(options));

/**
 * Prompts the user to select a key from the provided options and handles errors using `useClackError`.
 *
 * @template T - The type of the selectable keys, constrained to `string`.
 * @param options - The selection options to present to the user.
 * @returns The selected key of type `T`.
 */
export const selectKey = <T extends string>(options: SelectOptions<T>) =>
	useClackErrorPromise(() => ClackPrompts.selectKey(options));

/**
 * Executes a list of tasks using the `clackTasks` function and wraps the execution with error handling provided by `useClackError`.
 *
 * @param tasks - An array of `Task` objects to be executed.
 * @returns The result of the `clackTasks` execution, potentially wrapped or modified by `useClackError`.
 */
export const tasks = (tasks: Task[]) => useClackErrorPromise(() => ClackPrompts.tasks(tasks));

/**
 * Displays a text prompt using Clack, handling any errors that may occur.
 *
 * @param options - The options to configure the text prompt.
 * @returns The result of the text prompt, or an error if one occurs.
 */
export const text = (options: TextOptions) =>
	useClackErrorPromise(() => ClackPrompts.text(options));

/**
 * Updates the Clack settings by applying the provided updates.
 * Utilizes `useClackError` to handle any errors that may occur during the update process.
 *
 * @param updates - An object containing the new settings to apply.
 * @returns The result of the `clackUpdateSettings` function, wrapped with error handling.
 */
export const updateSettings = (updates: ClackSettings) =>
	useClackError(() => ClackPrompts.updateSettings(updates));

/**
 * Creates a spinner utility with customizable indicator.
 *
 * @param {SpinnerOptions} [options] - Options for the spinner, including an optional `indicator` string.
 *
 * All methods are wrapped with `useClackError` for error handling.
 */
export const spinner = Effect.fn((options: SpinnerOptions = {}) =>
	useClackError(() => {
		const s = ClackPrompts.spinner(options);
		return {
			start: (msg?: string) => useClackError(() => s.start(msg)),
			stop: (msg?: string, code?: number) => useClackError(() => s.stop(msg, code)),
			message: (msg?: string) => useClackError(() => s.message(msg)),
		};
	})
);

/**
 * Prompts the user with a confirmation message and returns whether to continue.
 *
 * @param userOpts - Options for the confirmation prompt.
 * @param userOpts.message - The message to display to the user. Defaults to "Continue?".
 * @returns A boolean indicating whether the user chose to continue (`true`) or cancel (`false`).
 */
export const askToContinue = Effect.fn(function* (userOpts?: { message: string }) {
	const defaultOpts = { message: 'Continue?', initialValue: true };
	const opts = yield* deepmerge((merge) => merge(defaultOpts, userOpts));
	const response = yield* confirm(opts);
	if (yield* isCancel(response)) return false;
	return response as boolean;
});

/**
 * Provides a set of logging utilities wrapped with effectful error handling.
 * Each method logs a message using the underlying `clackLog` implementation,
 * and handles errors via `useClackError`.
 *
 * @property message Logs a general message. Accepts an optional message and options.
 * @property success Logs a success message.
 * @property step Logs a step message, typically used for progress indication.
 * @property warn Logs a warning message.
 * @property warning Logs a warning message (alias for `warn`).
 * @property error Logs an error message.
 * @property info Logs an informational message.
 */
export const log = {
	message: Effect.fn((message?: string, options?: LogMessageOptions) =>
		useClackError(() => ClackPrompts.log.message(message, options))
	),
	success: Effect.fn((message: string) => useClackError(() => ClackPrompts.log.success(message))),
	step: Effect.fn((message: string) => useClackError(() => ClackPrompts.log.step(message))),
	warn: Effect.fn((message: string) => useClackError(() => ClackPrompts.log.warn(message))),
	warning: Effect.fn((message: string) => useClackError(() => ClackPrompts.log.warning(message))),
	error: Effect.fn((message: string) => useClackError(() => ClackPrompts.log.error(message))),
	info: Effect.fn((message: string) => useClackError(() => ClackPrompts.log.info(message))),
};

/**
 * Provides streaming logging methods wrapped in Effect functions,
 * with unified error handling via `useClackError`.
 *
 * Each method accepts an `Iterable<string>` or `AsyncIterable<string>` to stream messages,
 * and optionally accepts `LogMessageOptions` for the `message` method.
 *
 * Methods:
 * - `message`: Streams a general message, optionally with log options.
 * - `info`: Streams informational messages.
 * - `success`: Streams success messages.
 * - `step`: Streams step/progress messages.
 * - `warn`: Streams warning messages.
 * - `warning`: Alias for `warn`, streams warning messages.
 * - `error`: Streams error messages.
 */
export const stream = {
	message: Effect.fn(
		(iterable: Iterable<string> | AsyncIterable<string>, options?: LogMessageOptions) =>
			useClackErrorPromise(() => ClackPrompts.stream.message(iterable, options))
	),
	info: Effect.fn((iterable: Iterable<string> | AsyncIterable<string>) =>
		useClackErrorPromise(() => ClackPrompts.stream.info(iterable))
	),
	success: Effect.fn((iterable: Iterable<string> | AsyncIterable<string>) =>
		useClackErrorPromise(() => ClackPrompts.stream.success(iterable))
	),
	step: Effect.fn((iterable: Iterable<string> | AsyncIterable<string>) =>
		useClackErrorPromise(() => ClackPrompts.stream.step(iterable))
	),
	warn: Effect.fn((iterable: Iterable<string> | AsyncIterable<string>) =>
		useClackErrorPromise(() => ClackPrompts.stream.warn(iterable))
	),
	warning: Effect.fn((iterable: Iterable<string> | AsyncIterable<string>) =>
		useClackErrorPromise(() => ClackPrompts.stream.warning(iterable))
	),
	error: Effect.fn((iterable: Iterable<string> | AsyncIterable<string>) =>
		useClackErrorPromise(() => ClackPrompts.stream.error(iterable))
	),
};
