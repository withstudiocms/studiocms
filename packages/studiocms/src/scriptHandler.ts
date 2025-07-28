import { promises as fs } from 'node:fs';
import { createResolver, defineUtility } from 'astro-integration-kit';
import type { Script } from './types.js';

/**
 * Represents configuration options for the script handler.
 *
 * @property dbStartPage - If true, enables the database start page.
 * @property injectQuickActionsMenu - If true, injects the quick actions menu into the UI.
 * @property extraScripts - Optional array of additional scripts to be included.
 */
type Options = {
	dbStartPage: boolean;
	injectQuickActionsMenu: boolean;
	extraScripts?: Script[];
};

// Resolver Function
const { resolve } = createResolver(import.meta.url);

/**
 * Handles the injection of scripts during the Astro config setup phase.
 *
 * @utility astro:config:setup
 * @param params - An object containing the `injectScript` function used to inject scripts at specific stages.
 * @param options - Configuration options for script injection.
 * @param options.dbStartPage - Indicates if the database start page is active; disables quick actions menu script if true.
 * @param options.injectQuickActionsMenu - Enables injection of the quick actions menu script if true.
 * @param options.extraScripts - An optional array of additional scripts to inject.
 *
 * @remarks
 * - Reads and injects the `user-quick-tools.js` script if `injectQuickActionsMenu` is enabled and `dbStartPage` is false.
 * - Appends any extra scripts provided in the `extraScripts` option.
 * - Only scripts marked as `enabled` are injected at their specified stage.
 */
export const scriptHandler = defineUtility('astro:config:setup')(async (params, options: Options) => {
	const { injectScript } = params;

	const { dbStartPage, injectQuickActionsMenu, extraScripts } = options;

	/**
	 * An array of Script objects representing JavaScript files to be injected at specific stages of the page lifecycle.
	 * Each script contains its content, the stage at which it should be injected, and a flag indicating whether it is enabled.
	 *
	 * @remarks
	 * The first script in the array loads the 'user-quick-tools.js' file and is enabled only if `injectQuickActionsMenu` is true and `dbStartPage` is false.
	 *
	 * @example
	 * ```
	 * const scripts: Script[] = [
	 *   {
	 *     content: "...",
	 *     stage: "page",
	 *     enabled: true,
	 *   },
	 * ];
	 * ```
	 */
	const scripts: Script[] = [
		{
			content: await fs.readFile(resolve('./components/user-quick-tools.js'), 'utf-8'),
			stage: 'page',
			enabled: injectQuickActionsMenu && !dbStartPage,
		},
	];

	// If extraScripts are provided, append them to the scripts array
	// This allows for additional scripts to be injected without modifying the core script handler logic.
	// Each script in extraScripts should conform to the Script type.
	// The extraScripts array is optional and can be empty.
	// If it is provided, it will be merged with the existing scripts array.
	if (extraScripts && extraScripts.length > 0) {
		scripts.push(...extraScripts);
	}

	// Inject Scripts into Astro
	// Iterate over each script in the scripts array and inject it if it is enabled.
	// The injectScript function is called with the stage and content of each script.
	// This allows for dynamic script injection based on the configuration options provided.
	// Each script is injected at its specified stage, allowing for flexible script management.
	for (const { enabled, stage, content } of scripts) {
		if (enabled) injectScript(stage, content);
	}
});
