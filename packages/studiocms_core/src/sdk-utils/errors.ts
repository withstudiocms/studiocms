import { AstroError } from 'astro/errors';

/**
 * Represents an error specific to the StudioCMS SDK.
 * This class extends the `AstroError` class to provide additional context
 * and functionality for errors occurring within the StudioCMS SDK.
 *
 * @extends {AstroError}
 */
export class StudioCMS_SDK_Error extends AstroError {
	override name = 'StudioCMS SDK Error';
}

export default StudioCMS_SDK_Error;
