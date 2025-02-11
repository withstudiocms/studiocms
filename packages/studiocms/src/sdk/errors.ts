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
 * Represents an error specific to the StudioCMS cache operations.
 * This class extends the `StudioCMS_SDK_Error` to provide more context
 * about errors that occur within the caching mechanism of the StudioCMS.
 *
 * @extends StudioCMS_SDK_Error
 */
export class StudioCMSCacheError extends StudioCMS_SDK_Error {
	override name = 'StudioCMS Cache Error';
}
