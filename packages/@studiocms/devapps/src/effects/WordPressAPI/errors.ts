import { Data } from 'effect';

/**
 * Error class for WordPress API related errors.
 */
export class WPAPIError extends Data.TaggedError('WPAPIError')<{
	message: string;
	cause?: unknown;
}> {}
