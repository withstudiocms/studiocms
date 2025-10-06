/// <reference types="./global.d.ts" preserve="true" />
/// <reference types="./virtual.d.ts" preserve="true" />

import type { APIContext } from 'astro';
import type { PageDataCacheObject } from './virtuals/sdk/types/index.js';

/* v8 ignore start */
// These are re-exported from ./schemas/index.ts
export {
	type AvailableDashboardPages,
	type DashboardPage,
	definePlugin,
	type FinalDashboardPage,
	type SafePluginListType,
	type SettingsField,
	type StudioCMSPlugin,
} from './schemas/index.js';

export * from './utils/lang-helper.js';

/* v8 ignore stop */

interface StudioCMSAPIContextBase {
	pageData: PageDataCacheObject;
	AstroCtx: APIContext;
}

interface StudioCMSOnCreateAPIContext extends StudioCMSAPIContextBase {}

interface StudioCMSOnEditAPIContext extends StudioCMSAPIContextBase {
	pluginFields: Record<string, FormDataEntryValue | null>;
}

interface StudioCMSOnDeleteAPIContext extends StudioCMSAPIContextBase {}

type EndpointSelector = 'onCreate' | 'onEdit' | 'onDelete';

type StudioCMSPluginAPIContext<T extends EndpointSelector = EndpointSelector> = T extends 'onCreate'
	? StudioCMSOnCreateAPIContext
	: T extends 'onEdit'
		? StudioCMSOnEditAPIContext
		: StudioCMSOnDeleteAPIContext;

/**
 * Plugin API route handler type.
 *
 * @param context - The context object for the plugin API route.
 * @returns A promise that resolves to a response object.
 */
export type PluginAPIRoute<T extends EndpointSelector> = (
	context: StudioCMSPluginAPIContext<T>
) => Promise<Response>;
