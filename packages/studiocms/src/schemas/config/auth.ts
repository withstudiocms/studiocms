import { z } from 'astro/zod';

const localUsernameAndPasswordConfig = z
	.object({
		/**
		 * Allow User Registration - Allows users to register an account
		 *
		 * @default false
		 */
		allowUserRegistration: z.boolean().optional().default(true),
	})
	.optional()
	.default({});

//
// AUTH PROVIDER SCHEMA
//
export const authProviderSchema = z
	.object({
		/**
		 * Username and Password Auth Provider
		 *
		 */
		usernameAndPassword: z.boolean().optional().default(true),
		usernameAndPasswordConfig: localUsernameAndPasswordConfig,
	})
	.optional()
	.default({});

export type AuthProviders = z.infer<typeof authProviderSchema>;

//
// AUTH CONFIG SCHEMA
//
export const authConfigSchema = z
	.object({
		/**
		 * Auth Providers - Allows enabling or disabling of the Authentication Providers
		 */
		providers: authProviderSchema,
		/**
		 * Auth Enabled - Allows enabling or disabling of the Authentication Configuration
		 *
		 * @default true
		 */
		enabled: z.boolean().optional().default(true),
	})
	.optional()
	.default({});
