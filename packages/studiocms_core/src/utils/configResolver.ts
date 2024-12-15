import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { defineUtility } from 'astro-integration-kit';
import { StudioCMSCoreError } from '../errors';
import { type StudioCMSConfig, type StudioCMSOptions, StudioCMSOptionsSchema } from '../schemas';
import { loadStudioCMSConfigFile } from './configManager';

export function parseConfig(opts: StudioCMSOptions): StudioCMSConfig {
	return StudioCMSOptionsSchema.parse(opts);
}

/**
 * Resolves the StudioCMS Options
 *
 * @param {import("astro").HookParameters<"astro:config:setup">} params
 * @param {StudioCMSOptions} options
 *
 * @returns {StudioCMSOptions} The resolved StudioCMS Options
 */
export const configResolver = defineUtility('astro:config:setup')(
	async (params, options: StudioCMSOptions) => {
		// Destructure Params
		const { logger, config: astroConfig } = params;

		let resolvedOptions: StudioCMSConfig = parseConfig(options);

		console.log('Checking for StudioCMS Config File');

		// Merge the given options with the ones from a potential StudioCMS config file
		const studioCMSConfigFile = await loadStudioCMSConfigFile(astroConfig.root);

		console.log('studioCMSConfigFile', studioCMSConfigFile);

		if (studioCMSConfigFile) {
			console.log('There is a config file');
			const parsedOptions = StudioCMSOptionsSchema.safeParse(studioCMSConfigFile);

			// If the StudioCMS config file is invalid, throw an error
			if (!parsedOptions.success || parsedOptions.error || !parsedOptions.data) {
				const parsedErrors = parsedOptions.error.errors;
				const parsedErrorMap = parsedErrors.map((e) => ` - ${e.message}`).join('\n');
				const parsedErrorString = `The StudioCMS config file was found but the following errors where encountered while parsing it: \n${parsedErrorMap}`;
				throw new StudioCMSCoreError('Invalid StudioCMS Config File', parsedErrorString);
			}

			// Merge the options with Defaults
			resolvedOptions = { ...StudioCMSOptionsSchema._def.defaultValue, ...parsedOptions.data };

			// Log that the StudioCMS config file is being used if verbose
			integrationLogger(
				{ logger, logLevel: 'warn', verbose: resolvedOptions.verbose || false },
				'Your project includes a StudioCMS config file ("studiocms.config.{mjs|js|ts|mts|cjs|cts}"). To avoid unexpected results from merging multiple config sources, move all StudioCMS options to the StudioCMS config file. Or remove the file to use only the options provided in the Astro config.'
			);
		}

		return resolvedOptions;
	}
);
