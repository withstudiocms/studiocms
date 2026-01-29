import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { AuthAPIError } from '../errors.js';
import { OAuthProviderParam } from '../schemas.js';

/**
 * HTTP API endpoint for initiating OAuth flow for a specified provider.
 *
 * @remarks
 * This endpoint starts the OAuth authentication process for the given provider.
 *
 * @endpoint GET /{provider}
 * @title OAuth Index
 * @summary Initiate OAuth flow for the specified provider.
 *
 * @returns A redirect URL to the provider's OAuth authorization page (HTTP 303)
 * @throws {AuthAPIError} Returns a 400 status code for bad requests
 * @throws {AuthAPIError} Returns a 403 status code for forbidden access
 * @throws {AuthAPIError} Returns a 500 status code on server error
 */
export const oAuthIndexGet = HttpApiEndpoint.get('oAuthIndexGet', '/:provider')
	.setPath(OAuthProviderParam)
	.annotate(Title, 'OAuth Index')
	.annotate(Summary, 'Initiate OAuth flow for the specified provider')
	.annotate(Description, 'Initiates the OAuth authentication flow for the specified provider.')
	.addSuccess(
		Schema.String.annotations({
			description: "Redirect URL to the provider's OAuth authorization page",
		}),
		{ status: 303 }
	)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 403 })
	.addError(AuthAPIError, { status: 500 });

/**
 * HTTP API endpoint options for OAuth index.
 *
 * Defines the OPTIONS endpoint at `/{provider}` that provides metadata about
 * the OAuth index endpoint, including allowed HTTP methods and capabilities.
 *
 * @remarks
 * This endpoint follows the HTTP OPTIONS pattern to expose endpoint capabilities
 * without performing any data operations.
 *
 * @returns A void response on success
 * @throws {AuthAPIError} When a server error occurs (HTTP 500)
 */
export const oAuthIndexOptions = HttpApiEndpoint.options('oAuthIndexOptions', '/:provider')
	.setPath(OAuthProviderParam)
	.annotate(Title, 'Options for OAuth Index')
	.annotate(Summary, 'Retrieve OAuth Index Options')
	.annotate(Description, 'Provides options for the OAuth index endpoint.')
	.addSuccess(Schema.Void)
	.addError(AuthAPIError, { status: 500 });

/**
 * HTTP API endpoint for handling OAuth callback for a specified provider.
 *
 * @remarks
 * This endpoint processes the OAuth callback after authentication with the given provider.
 *
 * @endpoint GET /{provider}/callback
 * @title OAuth Callback
 * @summary Handle OAuth callback for the specified provider.
 *
 * @returns A redirect URL after successful authentication (HTTP 303)
 * @throws {AuthAPIError} Returns a 400 status code for bad requests
 * @throws {AuthAPIError} Returns a 403 status code for forbidden access
 * @throws {AuthAPIError} Returns a 500 status code on server error
 */
export const oAuthCallbackGet = HttpApiEndpoint.get('oAuthCallbackGet', '/:provider/callback')
	.setPath(OAuthProviderParam)
	.annotate(Title, 'OAuth Callback')
	.annotate(Summary, 'Handle OAuth callback for the specified provider')
	.annotate(
		Description,
		'Handles the OAuth callback after authentication with the specified provider. Each provider may have different requirements for handling the callback.'
	)
	.addSuccess(
		Schema.String.annotations({
			description: 'Redirect URL after successful authentication',
		}),
		{ status: 303 }
	)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 403 })
	.addError(AuthAPIError, { status: 500 });

/**
 * HTTP API endpoint options for OAuth callback.
 *
 * Defines the OPTIONS endpoint at `/{provider}/callback` that provides metadata about
 * the OAuth callback endpoint, including allowed HTTP methods and capabilities.
 *
 * @remarks
 * This endpoint follows the HTTP OPTIONS pattern to expose endpoint capabilities
 * without performing any data operations.
 *
 * @returns A void response on success
 * @throws {AuthAPIError} When a server error occurs (HTTP 500)
 */
export const oAuthCallbackOptions = HttpApiEndpoint.options(
	'oAuthCallbackOptions',
	'/:provider/callback'
)
	.setPath(OAuthProviderParam)
	.annotate(Title, 'Options for OAuth Callback')
	.annotate(Summary, 'Retrieve OAuth Callback Options')
	.annotate(Description, 'Provides options for the OAuth callback endpoint.')
	.addSuccess(Schema.Void)
	.addError(AuthAPIError, { status: 500 });
