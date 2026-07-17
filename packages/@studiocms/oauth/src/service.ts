import type { SessionError } from '@withstudiocms/auth-kit/errors';
import type { APIContext } from 'astro';
import { type ConfigError, Context, Data, type Effect } from 'effect';

/**
 * Represents an error that occurs within the `OAuthService`.
 *
 * This error class is used to encapsulate errors specific to the OAuth service operations,
 * providing a structured way to handle and report issues that arise during OAuth authentication flows.
 */
export class OAuthServiceError extends Data.TaggedError("OAuthServiceError")<{
  message: string;
}>{}

/**
 * The `OAuthService` class provides methods for handling OAuth authentication flows.
 *
 * @example
 * ```typescript
 * const oauthService = yield* OAuthService();
 * yield* oauthService.initSession(context);
 * yield* oauthService.initCallback(context);
 * ```
 */
export class OAuthService extends Context.Tag('@studiocms/oauth/service/OAuthService')<
	OAuthService,
	{
		initSession: (
			// biome-ignore lint/suspicious/noExplicitAny: Astro Types
			context: APIContext<Record<string, any>, Record<string, string | undefined>>
		) => Effect.Effect<Response, ConfigError.ConfigError | SessionError | OAuthServiceError, never>;
		initCallback: (
		  // biome-ignore lint/suspicious/noExplicitAny: Astro Types
			context: APIContext<Record<string, any>, Record<string, string | undefined>>
		) => Effect.Effect<Response, Error | ConfigError.ConfigError | OAuthServiceError, never>;
	}
>() {}
