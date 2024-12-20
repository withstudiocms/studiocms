import { defineUtility } from 'astro-integration-kit';
import { z } from 'astro/zod';
import lo from 'lodash';
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

function stripZodSchemaDefaults<T extends z.ZodTypeAny>(schema: T): T {
	if (schema instanceof z.ZodObject) {
		const newShape = Object.fromEntries(
			Object.entries(schema.shape).map(([key, value]) => {
				// Remove the default() if it exists
				if (value instanceof z.ZodDefault) {
					return [key, value._def.innerType];
				}
				return [key, value];
			})
		);
		return z.object(newShape) as unknown as T;
	}
	throw new StudioCMSCoreError('stripZodSchemaDefaults only works on Zod objects');
}

function parseAndMerge<T extends z.ZodTypeAny>(
	schema: T,
	inlineConfig: T['_output'],
	studioCMSConfigFile: T['_input']
): T['_output'] {
	try {
		const ZeroDefaultsSchema = stripZodSchemaDefaults(schema);
		const parsedConfigFile = ZeroDefaultsSchema.parse(studioCMSConfigFile);
		return lo.merge({}, inlineConfig, parsedConfigFile);
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
 * @returns {StudioCMSConfig} The resolved StudioCMS Options
 */
export const configResolver = defineUtility('astro:config:setup')(
	async (params, options: StudioCMSOptions) => {
		// Destructure Params
		const { logger: l, config: astroConfig } = params;

		const logger = l.fork('studiocms:config');

		const inlineConfigExists = options !== undefined;

		const inlineConfig: StudioCMSConfig = parseConfig(options);

		// Merge the given options with the ones from a potential StudioCMS config file
		const studioCMSConfigFile = await loadStudioCMSConfigFile(astroConfig.root);

		if (!studioCMSConfigFile) {
			return inlineConfig;
		}

		try {
			if (inlineConfigExists) {
				logger.warn(
					'Both an inline StudioCMS config (in your Astro config file) and a StudioCMS config file (studiocms.config.{js|mjs|cjs|ts|mts|cts}) were found. The StudioCMS config file will override the inline config during merging.'
				);
			}

			const mergedOptions = parseAndMerge(
				StudioCMSOptionsSchema,
				inlineConfig,
				studioCMSConfigFile
			);

			return mergedOptions;
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
);
