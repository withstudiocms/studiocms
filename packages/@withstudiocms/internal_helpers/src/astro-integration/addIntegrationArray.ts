import type { AstroIntegration } from 'astro';
import { addIntegration, defineUtility } from 'astro-integration-kit';

/**
 * Easily add a list of integrations from within an integration.
 *
 * @param {import("astro").HookParameters<"astro:config:setup">} params
 * @param {array} integrations
 *
 * @example
 * ```ts
 * import Vue from "@astrojs/vue";
 * import tailwindcss from "@astrojs/tailwind";
 *
 * addIntegrationArray(params, [
 *  { integration: Vue(), ensureUnique: true }
 *  { integration: tailwindcss() }
 * ])
 * ```
 *
 * @see https://astro-integration-kit.netlify.app/utilities/add-integration/
 */
export const addIntegrationArray = defineUtility('astro:config:setup')(
	(
		params,
		integrations: Array<{
			integration: AstroIntegration;
			ensureUnique?: boolean | undefined;
		}>
	): void => {
		for (const { integration, ensureUnique } of integrations) {
			addIntegration(params, { integration, ensureUnique });
		}
	}
);
