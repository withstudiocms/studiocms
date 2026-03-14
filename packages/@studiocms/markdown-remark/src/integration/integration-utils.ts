import type { AstroConfig, HookParameters } from 'astro';
import { AstroError } from 'astro/errors';
import type { Plugin, PluginOption } from 'vite';

export type Hooks = Required<Astro.IntegrationHooks>;

/**
 * A utility to be used on an Astro hook.
 *
 * @see defineUtility
 */

// biome-ignore lint/suspicious/noExplicitAny: As the utility is meant to be flexible, we allow any arguments to be passed in, but we still want type safety on the params.
export type HookUtility<THook extends keyof Hooks, TArgs extends Array<any>, TReturn> = (
	params: HookParameters<THook>,
	...args: TArgs
) => TReturn;

/**
 * Allows defining a type-safe function requiring all the params of a given hook.
 * It uses currying to make TypeScript happy.
 *
 * @param {string} _hook
 *
 * @see https://astro-integration-kit.netlify.app/core/define-utility/
 *
 * @example
 * ```ts
 * const test = defineUtility("astro:config:setup")((params, foo: boolean) => {
 *  return "bar";
 * });
 * ```
 */
export const defineUtility =
	<THook extends keyof Hooks>(_hook: THook) =>
	/**
	 * The function itself
	 * @param {Function} fn;
	 */

	// biome-ignore lint/suspicious/noExplicitAny: As the utility is meant to be flexible, we allow any arguments to be passed in, but we still want type safety on the params.
	<TArgs extends Array<any>, T>(fn: HookUtility<THook, TArgs, T>): HookUtility<THook, TArgs, T> =>
		fn;

function getPluginNames(plugins: AstroConfig['vite']['plugins']) {
	const names: string[] = [];

	if (plugins) {
		for (const plugin of plugins) {
			if (!plugin) continue;

			if (Array.isArray(plugin)) {
				names.push(...getPluginNames(plugin));
				continue;
			}

			if (plugin instanceof Promise) {
				continue;
			}

			names.push(plugin.name);
		}
	}

	return names;
}

/**
 * Checks for the existence of a Vite plugin inside the Astro config.
 *
 * @param {import("astro").HookParameters<"astro:config:setup">} params
 * @param {Params} options
 * @param {string | import("vite").PluginOption} options.plugin
 *
 * @see https://astro-integration-kit.netlify.app/utilities/has-vite-plugin/
 *
 * @example
 * ```ts
 * hasVitePlugin(params, {
 * 		plugin: "vite-plugin-my-integration",
 * })
 * ```
 */
export const hasVitePlugin = defineUtility('astro:config:setup')(
	(
		{ config },
		{
			plugin,
		}: {
			plugin: string | PluginOption;
		}
	): boolean => {
		if (!plugin || plugin instanceof Promise) return false;

		const currentPlugins = new Set(getPluginNames(config?.vite?.plugins));

		const plugins = new Set<string>();

		if (typeof plugin === 'string') {
			plugins.add(plugin);
		}

		if (typeof plugin === 'object') {
			if (Array.isArray(plugin)) {
				const names = new Set(
					getPluginNames(plugin as NonNullable<AstroConfig['vite']['plugins']>)
				);
				for (const name of names) plugins.add(name);
			} else {
				plugins.add(plugin.name);
			}
		}

		return [...plugins].some((name) => currentPlugins.has(name));
	}
);

/**
 * Adds a [vite plugin](https://vitejs.dev/guide/using-plugins) to the
 * Astro config.
 *
 * @param {import("astro").HookParameters<"astro:config:setup">} params
 * @param {object} options
 * @param {import("vite").PluginOption} options.plugin
 * @param {boolean} [options.warnDuplicated=true]
 *
 * @see https://astro-integration-kit.netlify.app/utilities/add-vite-plugin/
 *
 * @example
 * ```ts
 * addVitePlugin(params, {
 * 		plugin,
 * 		warnDuplicated: true,
 * })
 * ```
 */
export const addVitePlugin = defineUtility('astro:config:setup')(
	(
		params,
		{
			plugin,
			warnDuplicated = true,
		}: {
			plugin: PluginOption;
			warnDuplicated?: boolean;
		}
	) => {
		const { updateConfig, logger } = params;

		if (warnDuplicated && hasVitePlugin(params, { plugin })) {
			logger.warn(
				`The Vite plugin "${
					(plugin as Plugin).name
				}" is already present in your Vite configuration, this plugin may not behave correctly.`
			);
		}

		updateConfig({
			vite: {
				plugins: [plugin],
			},
		});
	}
);

type VirtualImport = {
	id: string;
	content: string;
	context?: 'server' | 'client' | undefined;
};

type Imports = Record<string, string> | Array<VirtualImport>;

const incrementPluginName = (name: string) => {
	let count = 1;
	return `${name.replace(/-(\d+)$/, (_, c) => {
		count = Number.parseInt(c, 10) + 1;
		return '';
	})}-${count}`;
};

const resolveVirtualModuleId = <T extends string>(id: T): `\0${T}` => {
	return `\0${id}`;
};

const createVirtualModule = (
	name: string,
	_imports: Imports,
	bypassCoreValidation: boolean
): Plugin => {
	// We normalize the imports into an array
	const imports: Array<VirtualImport> = Array.isArray(_imports)
		? _imports
		: Object.entries(_imports).map(([id, content]) => ({
				id,
				content,
				context: undefined,
			}));

	// We check for virtual imports with overlapping contexts, eg. several imports
	// with the same id and context server
	const duplicatedImports: Record<string, Array<string>> = {};
	for (const { id, context } of imports) {
		duplicatedImports[id] ??= [];
		duplicatedImports[id]?.push(...(context === undefined ? ['server', 'client'] : [context]));
	}
	for (const [id, contexts] of Object.entries(duplicatedImports)) {
		if (contexts.length !== [...new Set(contexts)].length) {
			throw new AstroError(
				`Virtual import with id "${id}" has been registered several times with conflicting contexts.`
			);
		}
	}

	const resolutionMap = Object.fromEntries(
		imports.map(({ id }) => {
			if (!bypassCoreValidation && id.startsWith('astro:')) {
				throw new AstroError(
					`Virtual import name prefix can't be "astro:" (for "${id}") because it's reserved for Astro core.`
				);
			}

			return [resolveVirtualModuleId(id), id];
		})
	);

	return {
		name,
		resolveId(id) {
			if (imports.find((_import) => _import.id === id)) {
				return resolveVirtualModuleId(id);
			}
			return;
		},
		load(id, options) {
			const resolution = resolutionMap[id];
			if (resolution) {
				const context = options?.ssr ? 'server' : 'client';
				const data = imports.find(
					(_import) =>
						_import.id === resolution &&
						(_import.context === undefined || _import.context === context)
				);

				if (data) {
					return data.content;
				}
			}
			return;
		},
	};
};

/**
 * Creates a Vite virtual module and updates the Astro config.
 * Virtual imports are useful for passing things like config options, or data computed within the integration.
 *
 * @param {import("astro").HookParameters<"astro:config:setup">} params
 * @param {object} options
 * @param {string} options.name
 * @param {Imports} options.imports
 *
 * @see https://astro-integration-kit.netlify.app/utilities/add-virtual-imports/
 *
 * @example
 * ```ts
 * // my-integration/index.ts
 * import { addVirtualImports } from "astro-integration-kit";
 *
 * addVirtualImports(params, {
 * 		name: 'my-integration',
 * 		imports: {
 * 			'virtual:my-integration/config': `export default ${ JSON.stringify({foo: "bar"}) }`,
 * 		},
 *	});
 * ```
 *
 * This is then readable anywhere else in your integration:
 *
 * ```ts
 * // myIntegration/src/component/layout.astro
 * import config from "virtual:my-integration/config";
 *
 * console.log(config.foo) // "bar"
 * ```
 */
export const addVirtualImports = defineUtility('astro:config:setup')(
	(
		params,
		{
			name,
			imports,
			__enableCorePowerDoNotUseOrYouWillBeFired = false,
		}: {
			name: string;
			imports: Imports;
			__enableCorePowerDoNotUseOrYouWillBeFired?: boolean;
		}
	) => {
		let pluginName = `vite-plugin-${name}`;

		while (hasVitePlugin(params, { plugin: pluginName }))
			pluginName = incrementPluginName(pluginName);

		addVitePlugin(params, {
			warnDuplicated: false,
			plugin: createVirtualModule(pluginName, imports, __enableCorePowerDoNotUseOrYouWillBeFired),
		});
	}
);
