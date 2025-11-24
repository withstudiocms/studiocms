import type { BasePluginHooks } from './schemas/plugins';

// The interfaces in this file can be extended by users
declare global {
	namespace StudioCMS {
		export interface PluginHooks extends BasePluginHooks {}
	}
}
