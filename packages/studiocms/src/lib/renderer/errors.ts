import { StudioCMSCoreError } from '../../errors.js';

export class StudioCMSRendererError extends StudioCMSCoreError {
	name = 'StudioCMS Renderer Error';
}

// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
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
