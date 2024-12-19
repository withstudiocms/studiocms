import { StudioCMS_SDK_Error } from '../utils';

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
