/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="astro/client" />
/// <reference types="studiocms/v/types" />

import { createResolver } from 'astro-integration-kit';
import { defineStorageManager, type StudioCMSStorageManager } from 'studiocms/plugins';

/**
 * Creates and configures a StudioCMS S3 Storage Manager plugin.
 *
 * This function initializes the S3 storage integration for StudioCMS by defining
 * a storage manager plugin with the necessary configuration and hooks.
 *
 * @returns {StudioCMSStorageManager} A configured storage manager instance that integrates
 * S3 storage capabilities with StudioCMS.
 *
 * @remarks
 * The storage manager registers a hook that sets up the S3 storage manager by resolving
 * the path to the storage manager implementation file. It requires StudioCMS version
 * 0.1.0-beta.31 or higher.
 *
 * @example
 * ```typescript
 * import { studiocmsS3Storage } from '@studiocms/s3-storage';
 *
 * const s3Storage = studiocmsS3Storage();
 * ```
 */
export function studiocmsS3Storage(): StudioCMSStorageManager {
	// Resolve the path to the current file
	const { resolve } = createResolver(import.meta.url);

	// Define the package identifier
	const packageIdentifier = '@studiocms/s3-storage';

	// Return the plugin configuration
	return defineStorageManager({
		identifier: packageIdentifier,
		name: 'StudioCMS S3 Storage',
		studiocmsMinimumVersion: '0.1.0-beta.31',
		hooks: {
			'studiocms:storage-manager': ({ setStorageManager, logger }) => {
				logger.info('StudioCMS S3 Storage initialized.');
				setStorageManager({
					managerPath: resolve('./s3-storage-manager.js'),
				});
			},
		},
	});
}

export default studiocmsS3Storage;
