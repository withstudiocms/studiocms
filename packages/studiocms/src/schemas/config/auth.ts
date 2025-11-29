import { z } from 'astro/zod';

export interface AuthConfig {
	/** Auth Providers - Allows enabling or disabling of the Authentication Providers */
	providers?: {
		/** Username and Password Auth Provider */
		usernameAndPassword?: boolean;

		/**
		 * Username and Password Auth Provider Configuration
		 */
		usernameAndPasswordConfig?: {
			/**
			 * Allow User Registration - Allows users to register an account
			 *
			 * @default true
			 */
			allowUserRegistration?: boolean;
		};
	};

	/**
	 * Auth Enabled - Allows enabling or disabling of the Authentication Configuration
	 *
	 * @default true
	 */
	enabled?: boolean;
}

//
// AUTH CONFIG SCHEMA
//
export const authConfigSchema = z
	.object({
		providers: z
			.object({
				usernameAndPassword: z.boolean().optional().default(true),
				usernameAndPasswordConfig: z
					.object({
						allowUserRegistration: z.boolean().optional().default(true),
					})
					.optional()
					.default({}),
			})
			.optional()
			.default({}),
		enabled: z.boolean().optional().default(true),
	})
	.optional()
	.default({});
