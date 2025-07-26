import { Data } from 'effect';
import { StudioCMSError } from '../errors.js';

/**
 * Represents an error specific to the StudioCMS SDK.
 * This class extends the `StudioCMSError` class to provide additional context
 * and functionality for errors occurring within the StudioCMS SDK.
 *
 * @extends {AstroError}
 */
export class StudioCMS_SDK_Error extends StudioCMSError {
	override name = 'StudioCMS SDK Error';
}

/**
 * Represents a core error in the StudioCMS SDK.
 * 
 * This error class is tagged with `'studiocms/sdk/errors/SDKCoreError'` and contains
 * additional metadata about the error type and its cause.
 *
 * @template T - The error metadata, including:
 *   - `type`: The type of error, either `'UNKNOWN'` or `'LibSQLDatabaseError'`.
 *   - `cause`: The underlying {@link StudioCMS_SDK_Error} that triggered this error.
 *
 * @remarks
 * - The `toString()` method returns a string representation of the error, including the cause's message.
 * - The `message` getter exposes the message from the underlying cause.
 */
export class SDKCoreError extends Data.TaggedError('studiocms/sdk/errors/SDKCoreError')<{
	readonly type: 'UNKNOWN' | 'LibSQLDatabaseError';
	readonly cause: StudioCMS_SDK_Error;
}> {
	public override toString() {
		return `SDKCoreError: ${this.cause.message}`;
	}

	public get message() {
		return this.cause.message;
	}
}
