import createPathResolver from '@withstudiocms/internal_helpers/pathResolver';
import { defineStorageManager, type StudioCMSStorageManager } from '../../schemas/index.js';

const { resolve } = createPathResolver(import.meta.url);

/**
 * Defines a No-Op Storage Manager plugin for StudioCMS.
 *
 * This storage manager performs no operations and serves as a placeholder.
 *
 * @param version - The minimum StudioCMS version required for this storage manager.
 * @returns A StudioCMSStorageManager plugin definition.
 */
export const NoOpStorageManager = (version: string): StudioCMSStorageManager =>
	defineStorageManager({
		identifier: 'studiocms/no-op-storage',
		name: 'Core No-Op Storage (built-in)',
		studiocmsMinimumVersion: version,
		hooks: {
			'studiocms:storage-manager': ({ setStorageManager, logger }) => {
				logger.info('No-Op Storage initialized.');
				setStorageManager({
					managerPath: resolve('./core/no-op-storage-manager.js'),
				});
			},
		},
	});
