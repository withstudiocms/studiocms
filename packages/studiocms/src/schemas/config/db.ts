import * as Schema from 'effect/Schema';

/**
 * Schema for the database configuration.
 */
export const DbConfigSchema = Schema.Struct({
	dialect: Schema.optionalWith(Schema.Literal('libsql', 'postgres', 'mysql'), {
		default: () => 'libsql',
	}).annotations({
		description: 'Database Dialect to use',
	}),
}).annotations({
	title: 'Database Configuration',
	description: 'Configuration options related to the database',
	identifier: 'DbConfig',
});

/**
 * Type for the database configuration.
 */
export type DbConfig = typeof DbConfigSchema.Encoded;

/**
 * Resolved type for the database configuration.
 */
export type DbConfigResolved = typeof DbConfigSchema.Type;
