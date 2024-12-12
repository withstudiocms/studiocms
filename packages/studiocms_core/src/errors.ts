import { AstroError } from 'astro/errors';
import { StudioCMS_SDK_Error } from './sdk-utils/utils';

export { StudioCMS_SDK_Error };

/**
 * Represents an error specific to the StudioCMS SDK.
 * This class extends the `AstroError` class to provide additional context
 * and functionality for errors occurring within the StudioCMS SDK.
 *
 * @extends {AstroError}
 */
export class StudioCMSError extends AstroError {
	override name = 'StudioCMS Error';
}

export class StudioCMSCoreError extends AstroError {
	override name = 'StudioCMS Core Error';
}
