import * as Schema from 'effect/Schema';
import { BooleanDefaultTrue } from '../custom.js';

/**
 * Schema for the API configuration, which includes settings for enabling or disabling the API documentation.
 */
export const ApiConfigSchema = Schema.Struct({
	apiDocs: BooleanDefaultTrue.annotations({
		description:
			'API Documentation - Allows enabling or disabling of the API documentation. These docs will be available at the /studiocms_api/docs route and provide an interactive interface for exploring the API specifications and endpoints. Disabling this option will hide the documentation route, which can be useful in production environments for security reasons.',
	}),
}).annotations({
	title: 'API Configuration',
	description: 'API Configuration - Configure the API settings for the dashboard',
	identifier: 'ApiConfig',
});

/**
 * Type for the API configuration.
 */
export type ApiConfig = typeof ApiConfigSchema.Encoded;

/**
 * Resolved type for the API configuration.
 */
export type ApiConfigResolved = typeof ApiConfigSchema.Type;
