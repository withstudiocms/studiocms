import type { InjectedScriptStage } from 'astro';
import { defineUtility } from 'astro-integration-kit';

/**
 * Represents a script to be injected at a specific stage of the integration process.
 *
 * @property stage - The stage at which the script should be injected.
 * @property content - The actual script content as a string.
 * @property enabled - Indicates whether the script is enabled for injection.
 */
export interface ScriptEntry {
	stage: InjectedScriptStage;
	content: string;
	enabled: boolean;
}

/**
 * Injects scripts into the Astro configuration setup stage.
 *
 * This utility iterates over an array of script entries and injects each enabled script
 * at the specified stage using the provided `params.injectScript` method.
 *
 * @param params - The parameters provided by the Astro integration context, including the `injectScript` function.
 * @param entries - An array of script entries to be injected. Each entry contains:
 *   - `stage`: The stage at which the script should be injected.
 *   - `content`: The script content to inject.
 *   - `enabled`: A boolean indicating whether the script should be injected.
 */
export const injectScripts = defineUtility('astro:config:setup')(
	({ injectScript }, entries: ScriptEntry[]) => {
		for (const { enabled, stage, content } of entries) {
			if (!enabled) continue;
			injectScript(stage, content);
		}
	}
);
