import * as Schema from 'effect/Schema';
import { OptionalWithDefaults } from '../custom.js';

/**
 * Schema for the demo mode configuration.
 */
export const DemoModeSchema = Schema.Union(
	Schema.Boolean,
	Schema.Struct({
		username: Schema.String,
		password: Schema.String,
	})
);

/**
 * Schema for the developer configuration.
 */
export const DeveloperConfigSchema = Schema.Struct({
	demoMode: OptionalWithDefaults(DemoModeSchema, false).annotations({
		description: 'Demo Mode - Allows enabling or disabling of the demo mode',
	}),
}).annotations({
	title: 'Developer Configuration',
	description: 'Configuration options related to development features',
	identifier: 'DeveloperConfig',
});

/**
 * Type for the developer configuration.
 */
export type DeveloperConfig = typeof DeveloperConfigSchema.Encoded;

/**
 * Resolved type for the developer configuration.
 */
export type DeveloperConfigResolved = typeof DeveloperConfigSchema.Type;
