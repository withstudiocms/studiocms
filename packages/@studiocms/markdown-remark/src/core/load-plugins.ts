/** biome-ignore-all lint/suspicious/noExplicitAny: Allowed for dynamic operations */
import type * as unified from 'unified';
import { importPlugin as _importPlugin } from './import-plugin.ts';

async function importPlugin(p: string | unified.Plugin<any[], any>) {
	if (typeof p === 'string') {
		return await _importPlugin(p);
	}
	return p;
}

/**
 * Loads an array of plugins, which can be specified in various formats, and returns a promise for each plugin.
 *
 * @param items - An array of plugins or plugin configurations. Each item can be:
 * - A string representing the plugin name.
 * - A tuple where the first element is a string representing the plugin name and the second element is the plugin options.
 * - A unified plugin.
 * - A tuple where the first element is a unified plugin and the second element is the plugin options.
 *
 * @returns An array of promises, each resolving to a tuple where the first element is the loaded plugin and the optional second element is the plugin options.
 */
export function loadPlugins(
	items: (string | [string, any] | unified.Plugin<any[], any> | [unified.Plugin<any[], any>, any])[]
): Promise<[unified.Plugin, any?]>[] {
	return items.map((p) => {
		return new Promise((resolve, reject) => {
			if (Array.isArray(p)) {
				const [plugin, opts] = p;
				return importPlugin(plugin)
					.then((m) => resolve([m, opts]))
					.catch((e) => reject(e));
			}

			return importPlugin(p)
				.then((m) => resolve([m]))
				.catch((e) => reject(e));
		});
	});
}
