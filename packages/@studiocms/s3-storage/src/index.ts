/**
 * These triple-slash directives defines dependencies to various declaration files that will be
 * loaded when a user imports the StudioCMS plugin in their Astro configuration file. These
 * directives must be first at the top of the file and can only be preceded by this comment.
 */
/// <reference types="astro/client" />
/// <reference types="studiocms/v/types" />

import { createResolver } from 'astro-integration-kit';
import { defineStorageManager, type StudioCMSStorageManager } from 'studiocms/plugins';

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
