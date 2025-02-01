import { StudioCMSCoreError } from '@studiocms/core/errors';
import {
	type StudioCMSConfig,
	type StudioCMSOptions,
	StudioCMSOptionsSchema,
} from '@studiocms/core/schemas';
import { defineUtility } from 'astro-integration-kit';
import { z } from 'astro/zod';
import lo from 'lodash';
import { loadStudioCMSConfigFile } from './configManager.js';

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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function deepRemoveDefaults(schema: z.ZodTypeAny): any {
	if (schema instanceof z.ZodDefault) return deepRemoveDefaults(schema.removeDefault());

	if (schema instanceof z.ZodObject) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const newShape: any = {};

		for (const key in schema.shape) {
			const fieldSchema = schema.shape[key];
			newShape[key] = z.ZodOptional.create(deepRemoveDefaults(fieldSchema));
		}
		return new z.ZodObject({
			...schema._def,
			shape: () => newShape,
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		}) as any;
	}

	if (schema instanceof z.ZodArray) return z.ZodArray.create(deepRemoveDefaults(schema.element));

	if (schema instanceof z.ZodOptional)
		return z.ZodOptional.create(deepRemoveDefaults(schema.unwrap()));

	if (schema instanceof z.ZodNullable)
		return z.ZodNullable.create(deepRemoveDefaults(schema.unwrap()));

	if (schema instanceof z.ZodTuple)
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		return z.ZodTuple.create(schema.items.map((item: any) => deepRemoveDefaults(item)));

	return schema;
}

function parseAndMerge<T extends z.ZodTypeAny>(
	schema: T,
	inlineConfig: T['_output'],
	studioCMSConfigFile: T['_input']
): T['_output'] {
	try {
		const ZeroDefaultsSchema = deepRemoveDefaults(schema);
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
