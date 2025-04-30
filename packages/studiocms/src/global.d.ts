import type { BasePluginHooks, StudioCMSPlugin } from './schemas/plugins/index.js';

// The interfaces in this file can be extended by users
declare global {
	namespace StudioCMS {
		export interface PluginHooks extends BasePluginHooks {}
	}
	namespace Astro {
		export interface IntegrationHooks {
			'studiocms:plugins'?: (options: {
				exposePlugins: (opts?: StudioCMSPlugin[]) => void;
			}) => void | Promise<void>;
		}
	}
}
