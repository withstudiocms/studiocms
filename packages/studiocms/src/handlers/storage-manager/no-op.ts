import createPathResolver from '@withstudiocms/internal_helpers/pathResolver';
import type { StudioCMSStorageManager } from '../../schemas/index.js';

const { resolve } = createPathResolver(import.meta.url);

export const NoOpStorageManager = (version: string): StudioCMSStorageManager => ({
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
