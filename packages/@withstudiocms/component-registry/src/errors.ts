import { Data } from '@withstudiocms/effect';
import { AstroError } from 'astro/errors';

export class ComponentProxyError extends AstroError {
	message: string;
	stack?: string;
	name = 'Component Proxy Error';
	constructor(message: string, hint: string, stack?: string) {
		super(message, hint);
		this.message = message;
		this.hint = hint;
		this.stack = stack;
	}
}

export function prefixError(err: Error, prefix: string): Error {
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

/**
 * Error class representing issues related to the component registry.
 *
 * @remarks
 * This error extends a tagged error type with the tag `'ComponentRegistryError'`.
 *
 * @example
 * ```typescript
 * throw new ComponentRegistryError({ message: "Component not found" });
 * ```
 *
 * @property message - A descriptive error message.
 * @property cause - (Optional) The underlying cause of the error, if any.
 */
export class ComponentRegistryError extends Data.TaggedError('ComponentRegistryError')<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when a file fails to parse.
 *
 * @remarks
 * This error extends a tagged error type with the tag 'FileParseError'.
 *
 * @example
 * ```typescript
 * throw new FileParseError({ filePath: '/path/to/file', message: 'Invalid format' });
 * ```
 *
 * @property filePath - The path of the file that failed to parse.
 * @property message - A descriptive error message.
 * @property cause - (Optional) The underlying cause of the error, if available.
 */
export class FileParseError extends Data.TaggedError('FileParseError')<{
	readonly filePath: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when a requested component cannot be found in the registry.
 *
 * @remarks
 * This error extends a tagged error type with the tag 'ComponentNotFoundError'.
 *
 * @example
 * ```typescript
 * throw new ComponentNotFoundError({ componentName: 'MyComponent' });
 * ```
 *
 * @property componentName - The name of the component that was not found.
 */
export class ComponentNotFoundError extends Data.TaggedError('ComponentNotFoundError')<{
	readonly componentName: string;
}> {}

export function toComponentProxyError(err: Error, prefix: string): ComponentProxyError {
	const wrapped = prefixError(err, prefix);
	return new ComponentProxyError(wrapped.message, wrapped.message, wrapped.stack);
}
