import { z } from 'astro/zod';

export const developerConfigSchema = z
	.object({
		/**
		 * Enable demo mode for the site
		 *
		 * If set to an object, the site will be in demo mode, and the user will be able to login with the provided username and password.
		 *
		 * @default false
		 * @example
		 * ```ts
		 * {
		 *   demoMode: {
		 *     username: "demo_user",
		 *     password: "some-demo-password"
		 *   }
		 * }
		 * ```
		 */
		demoMode: z
			.union([z.literal(false), z.object({ username: z.string(), password: z.string() })])
			.optional()
			.default(false),
	})
	.optional()
	.default({ demoMode: false });
