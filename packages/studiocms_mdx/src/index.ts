import { type StudioCMSPlugin, definePlugin } from 'studiocms/plugins';

export function plugin(): StudioCMSPlugin {
	return definePlugin({
		identifier: '',
		name: '',
		studiocmsMinimumVersion: '0.1.0-beta.8',
		pageTypes: [{ identifier: '', label: '' }],
	});
}

export default plugin;
