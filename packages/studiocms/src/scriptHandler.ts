import fs from 'node:fs';
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
export const scriptHandler = defineUtility('astro:config:setup')((params, options: Options) => {
	const { injectScript } = params;

	const { dbStartPage, injectQuickActionsMenu, extraScripts } = options;

	const scripts: Script[] = [
		{
			content: fs.readFileSync(resolve('./components/user-quick-tools.js'), 'utf-8'),
			stage: 'page',
			enabled: injectQuickActionsMenu && !dbStartPage,
		},
	];

	if (extraScripts && extraScripts.length > 0) {
		scripts.push(...extraScripts);
	}

	// Inject Scripts
	for (const { enabled, stage, content } of scripts) {
		if (enabled) injectScript(stage, content);
	}
});
