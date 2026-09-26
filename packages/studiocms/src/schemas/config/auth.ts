import * as Schema from 'effect/Schema';
import { BooleanDefaultTrue, OptionalWithDefaults } from '../custom.js';

/**
 * Schema for the username and password authentication provider configuration.
 */
export const UsernameAndPasswordConfigSchema = Schema.Struct({
	allowUserRegistration: BooleanDefaultTrue.annotations({
		description: 'Allow User Registration - Allows users to register an account',
	}),
}).annotations({
	title: 'Username and Password Auth Provider Configuration',
	description: 'Username and Password Auth Provider Configuration',
	identifier: 'UsernameAndPasswordConfig',
});

/**
 * Schema for the authentication providers configuration.
 */
export const AuthProvidersConfigSchema = Schema.Struct({
	usernameAndPassword: BooleanDefaultTrue.annotations({
		description: 'Username and Password Auth Provider',
	}),
	usernameAndPasswordConfig: OptionalWithDefaults(UsernameAndPasswordConfigSchema, {}),
}).annotations({
	title: 'Auth Providers',
	description: 'Auth Providers - Allows enabling or disabling of the Authentication Providers',
	identifier: 'AuthProvidersConfig',
});

/**
 * Schema for the authentication configuration.
 */
export const AuthConfigSchema = Schema.Struct({
	enabled: BooleanDefaultTrue.annotations({
		description: 'Auth Enabled - Allows enabling or disabling of the Authentication Configuration',
	}),
	providers: OptionalWithDefaults(AuthProvidersConfigSchema, {}),
}).annotations({
	title: 'Authentication Configuration',
	description: 'Authentication Configuration',
	identifier: 'AuthConfig',
});

/**
 * Type for the authentication configuration.
 */
export type AuthConfig = typeof AuthConfigSchema.Encoded;

/**
 * Resolved type for the authentication configuration.
 */
export type AuthConfigResolved = typeof AuthConfigSchema.Type;
