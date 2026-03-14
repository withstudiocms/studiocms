import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSAuthApi } from '@withstudiocms/api-spec';
import { Layer } from 'effect';
import { AuthAPIHandler } from './auth.js';
import { OAuthAPIHandler } from './oauth.js';

/**
 * Combined API Handler for all authentication-related endpoints, including both primary auth handlers and OAuth handlers.
 */
const AuthApiHandlersGroup = Layer.merge(AuthAPIHandler, OAuthAPIHandler);

/**
 * Live implementation of the authentication API, providing handlers for login, logout, and forgot password functionality.
 */
export const AuthAPILive = HttpApiBuilder.api(StudioCMSAuthApi).pipe(
	Layer.provide(AuthApiHandlersGroup)
);
