import type * as hast from 'hast';
import type * as unified from 'unified';

// biome-ignore lint/suspicious/noExplicitAny: any is used to match the generic type
export type RehypePlugin<PluginParameters extends any[] = any[]> = unified.Plugin<
	PluginParameters,
	hast.Root
>;

// biome-ignore lint/suspicious/noExplicitAny: any is used to match the generic type
export type RehypePlugins = (string | [string, any] | RehypePlugin | [RehypePlugin, any])[];
