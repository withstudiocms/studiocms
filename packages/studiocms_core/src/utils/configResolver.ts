import { defineUtility } from 'astro-integration-kit';
import { StudioCMSCoreError } from '../errors';
import { type StudioCMSConfig, type StudioCMSOptions, StudioCMSOptionsSchema } from '../schemas';
import { loadStudioCMSConfigFile } from './configManager';

export function parseConfig(opts: StudioCMSOptions): StudioCMSConfig {
	try {
		return StudioCMSOptionsSchema.parse(opts);
	} catch (error) {
		if (error instanceof Error) {
			throw new StudioCMSCoreError(
				`Invalid StudioCMS Config Options: ${error.message}`,
				error.stack
			);
		}
		throw new StudioCMSCoreError(
			'Invalid StudioCMS Options',
			'An unknown error occurred while parsing the StudioCMS options.'
		);
	}
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
		const { logger: l, config: astroConfig } = params;

		const logger = l.fork('studiocms:config');

		const inlineConfigExists = options !== undefined;

		const resolvedOptions: StudioCMSConfig = parseConfig(options);

		// Merge the given options with the ones from a potential StudioCMS config file
		const studioCMSConfigFile = await loadStudioCMSConfigFile(astroConfig.root);

		if (studioCMSConfigFile) {
			try {
				const parsedOptions = StudioCMSOptionsSchema.parse(studioCMSConfigFile);

				if (inlineConfigExists) {
					logger.warn(
						'Both an inline StudioCMS config (in your Astro config file) and a StudioCMS config file (studiocms.config.{js|mjs|cjs|ts|mts|cts}) were found. The StudioCMS config file will override the inline config.'
					);
				}

				return parsedOptions;
			} catch (error) {
				if (error instanceof Error) {
					throw new StudioCMSCoreError(
						`Invalid StudioCMS Config Options: ${error.message}`,
						error.stack
					);
				}
				throw new StudioCMSCoreError(
					'Invalid StudioCMS Options',
					'An unknown error occurred while parsing the StudioCMS options.'
				);
			}
		}

		return resolvedOptions;
	}
);
