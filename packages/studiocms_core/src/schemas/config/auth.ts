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
		 * GitHub Auth Provider - Powered by Arctic
		 *
		 * Requires a GitHub OAuth App to be created and configured using ENV Variables
		 *
		 * @default false
		 */
		github: z.boolean().optional().default(false),
		/**
		 * Discord Auth Provider - Powered by Arctic
		 *
		 * Requires a Discord OAuth App to be created and configured using ENV Variables
		 *
		 * @default false
		 */
		discord: z.boolean().optional().default(false),
		/**
		 * Google Auth Provider - Powered by Arctic
		 *
		 * Requires a Google OAuth App to be created and configured using ENV Variables
		 *
		 * @default false
		 */
		google: z.boolean().optional().default(false),
		/**
		 * Auth0 Auth Provider - Powered by Arctic
		 *
		 * Requires an Auth0 Application to be created and configured using ENV Variables
		 *
		 * @default false
		 */
		auth0: z.boolean().optional().default(false),
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
