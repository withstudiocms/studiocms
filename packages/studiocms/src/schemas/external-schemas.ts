import { type AvailableIcons, availableIcons } from 'studiocms:ui/icons';
import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import * as Schema from 'effect/Schema';
import { SyncFunctionSchema } from 'effectify/schemas';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';

/**
 * Schema for validating UI icon names against the list of available icons in StudioCMS.
 *
 * This schema checks if the provided input is a string and if it exists in the list of available icons, ensuring that only valid icon names are used in plugin configurations.
 */
export const UIIconListSchema = Schema.declare(
	(input: unknown): input is AvailableIcons => {
		if (typeof input !== 'string') {
			return false;
		}
		return availableIcons.includes(input as AvailableIcons);
	},
	{
		title: 'UIIconListSchema',
		identifier: 'UIIconListSchema',
		description:
			'Schema for validating UI icon names against the list of available icons in StudioCMS.',
	}
);

/**
 * Schema for validating SanitizeOptions objects used in plugin configurations.
 */
export const SanitizeOptionsSchema = Schema.declare(
	(input: unknown): input is SanitizeOptions => {
		if (typeof input !== 'object' || input === null) {
			return false;
		}
		// If the input is an object, we assume it's a valid SanitizeOptions object.
		return true;
	},
	{
		title: 'SanitizeOptionsSchema',
		identifier: 'SanitizeOptionsSchema',
		description: 'Schema for validating SanitizeOptions objects used in plugin configurations.',
	}
);

/**
 * Astro Component Schema for defining the structure of an Astro component used in plugins.
 *
 * This schema uses the SyncFunctionSchema to validate that the provided input is a function that takes any arguments and returns any output, allowing for flexibility in defining Astro components within plugins while ensuring they adhere to the expected function structure.
 */
export const AstroComponentSchema = SyncFunctionSchema(Schema.Any, Schema.Any);

/**
 * Schema for validating Astro integrations used in plugin configurations.
 */
export const AstroIntegrationSchema = Schema.declare(
	(input: unknown): input is AstroIntegration => {
		if (typeof input !== 'object' || input === null) {
			return false;
		}
		if ('name' in input && typeof input.name === 'string') {
			return true;
		}
		return false;
	},
	{
		title: 'AstroIntegrationSchema',
		identifier: 'AstroIntegrationSchema',
		description: 'Schema for validating Astro integrations used in plugin configurations.',
	}
);

/**
 * Schema for validating Astro integration loggers used in plugin configurations.
 */
export const AstroIntegrationLoggerSchema = Schema.declare(
	(input: unknown): input is AstroIntegrationLogger => {
		if (typeof input !== 'object' || input === null) {
			return false;
		}
		if (
			'info' in input &&
			typeof input.info === 'function' &&
			'warn' in input &&
			typeof input.warn === 'function' &&
			'error' in input &&
			typeof input.error === 'function' &&
			'debug' in input &&
			typeof input.debug === 'function'
		) {
			return true;
		}
		return false;
	}
);
