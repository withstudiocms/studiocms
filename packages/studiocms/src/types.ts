import type { StudioCMSPluginOptions } from '@studiocms/core/schemas';

export type SafePluginListType = Omit<StudioCMSPluginOptions, 'integration'>[];
export type { StudioCMSPluginOptions };
