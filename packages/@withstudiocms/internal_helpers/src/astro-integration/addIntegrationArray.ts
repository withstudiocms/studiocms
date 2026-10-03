import type { AstroIntegration, HookParameters } from 'astro';

/* v8 ignore start */
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
export const addIntegrationArray = (
	params: HookParameters<'astro:config:setup'>,
	integrations: Array<{
		integration: AstroIntegration;
		ensureUnique?: boolean | undefined;
	}>
): void => {
	for (const { integration, ensureUnique } of integrations) {
		if (ensureUnique) {
			// Check if the integration is already present in the config
			const isAlreadyPresent = params.config.integrations.some(
				(existingIntegration) => existingIntegration.name === integration.name
			);

			if (isAlreadyPresent) {
				// Skip adding this integration if it's already present
				continue;
			}
		}
		params.updateConfig({
			integrations: [integration],
		});
	}
};
/* v8 ignore stop */
