import { AstroError } from 'astro/errors';

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

/**
 * Represents an error specific to the core functionality of StudioCMS.
 * This class extends the `StudioCMSError` class and overrides the `name` property
 * to provide a more specific error name.
 */
export class StudioCMSCoreError extends StudioCMSError {
	override name = 'StudioCMS Core Error';
}
