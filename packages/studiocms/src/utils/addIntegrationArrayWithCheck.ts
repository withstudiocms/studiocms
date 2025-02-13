import type { AstroIntegration } from 'astro';
import { addIntegration, defineUtility, hasIntegration } from 'astro-integration-kit';

/**
 * Add Integration Array with Check
 *
 * Checks if the integration is enabled and if it already exists then adds it to the Astro Config if needed.
 */
export const addIntegrationArrayWithCheck = defineUtility('astro:config:setup')(
	(
		params,
		integrations: {
			enabled: boolean;
			knownSimilar: string[];
			integration: AstroIntegration;
		}[]
	) => {
		// Run through each integration in the array
		for (const { enabled, knownSimilar, integration } of integrations) {
			// If the integration is enabled
			if (enabled) {
				// Check if the integration already exists
				for (const known of knownSimilar) {
					if (hasIntegration(params, { name: known })) {
						// If the integration exists, log that it is already there
						params.logger.info(
							`Integration ${known} already exists. Skipping ${integration.name}...`
						);
						break;
					}
				}
				// If the integration does not exist, add it
				params.logger.info(`No known similar integrations found. Adding ${integration.name}...`);
				addIntegration(params, { integration, ensureUnique: true });
			} else {
				// If the integration is not enabled, log that it is disabled
				params.logger.info(`Integration ${integration.name} is disabled. Skipping...`);
			}
		}
	}
);
