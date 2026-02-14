import type { BasePluginHooks, StorageManagerPluginHooks } from './schemas/plugins';
import type {
	BasePluginHooks as Next_BasePluginHooks,
	StorageManagerPluginHooks as Next_StorageManagerPluginHooks,
} from './schemas/plugins/index.effect';

// The interfaces in this file can be extended by users
declare global {
	namespace StudioCMS {
		export interface PluginHooks extends BasePluginHooks {}
		export interface StorageManagerHooks extends BasePluginHooks, StorageManagerPluginHooks {}

		export interface Next_PluginHooks extends Next_BasePluginHooks {}
		export interface Next_StorageManagerHooks
			extends Next_BasePluginHooks,
				Next_StorageManagerPluginHooks {}
	}
}
