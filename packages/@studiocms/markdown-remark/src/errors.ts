import { AstroError } from 'astro/errors';

export class MarkdownRemarkError extends AstroError {
	name = 'StudioCMS Markdown Remark Error';
}

/**
 * Utility function to prefix an error message with additional context. This is useful for providing more informative error messages without losing the original error's information.
 *
 * The function attempts to modify the original error's message property to include the prefix. If that fails (e.g., if the error is not an object or does not have a message property), it creates a new error with the prefixed message and attempts to copy the stack trace and cause from the original error.
 *
 * @param err The original error to be prefixed. This can be of any type, but if it is an object with a message property, that message will be modified to include the prefix.
 * @param prefix The string to prefix the error message with. This should provide additional context about where or why the error occurred.
 * @returns The original error with the modified message if possible, or a new error with the prefixed message and the original error as its cause if the original error could not be modified.
 */
// biome-ignore lint/suspicious/noExplicitAny: Errors can be of any shape, and we want to be able to prefix any error with additional context without losing the original error's information.
export function prefixError(err: any, prefix: string): any {
	// If the error is an object with a `message` property, attempt to prefix the message
	if (err?.message) {
		try {
			err.message = `${prefix}:\n${err.message}`;
			return err;
		} catch {
			// Any errors here are ok, there's fallback code below
		}
	}

	// If that failed, create a new error with the desired message and attempt to keep the stack
	const wrappedError = new Error(`${prefix}${err ? `: ${err}` : ''}`);
	try {
		wrappedError.stack = err.stack;
		wrappedError.cause = err;
	} catch {
		// It's ok if we could not set the stack or cause - the message is the most important part
	}

	return wrappedError;
}
