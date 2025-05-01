import type { BasePluginHooks, StudioCMSPlugin, StudioCMSPluginHook } from './schemas/plugins';

// The interfaces in this file can be extended by users
declare global {
	namespace StudioCMS {
		export interface PluginHooks extends BasePluginHooks {}
	}
	namespace Astro {
		export interface IntegrationHooks extends StudioCMSPluginHook {}
	}
}
