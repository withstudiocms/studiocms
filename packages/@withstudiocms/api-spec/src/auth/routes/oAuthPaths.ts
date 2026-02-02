import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import * as Schema from 'effect/Schema';
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
export const oAuthIndexGet = HttpApiEndpoint.get('oAuthInit', '/:provider')
	.setPath(OAuthProviderParam)
	.annotate(Title, 'OAuth Index')
	.annotate(Summary, 'Initiate OAuth flow for the specified provider')
	.annotate(Description, 'Initiates the OAuth authentication flow for the specified provider.')
	.addSuccess(
		Schema.Null.annotations({
			Description: 'Redirect... (Location header set to URL)',
		}),
		{ status: 302 } // Astro Redirects default to 302
	)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 403 })
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
export const oAuthCallbackGet = HttpApiEndpoint.get('oAuthCallback', '/:provider/callback')
	.setPath(OAuthProviderParam)
	.annotate(Title, 'OAuth Callback')
	.annotate(Summary, 'Handle OAuth callback for the specified provider')
	.annotate(
		Description,
		'Handles the OAuth callback after authentication with the specified provider. Each provider may have different requirements for handling the callback.'
	)
	.addSuccess(
		Schema.Null.annotations({
			Description: 'Redirect... (Location header set to URL)',
		}),
		{ status: 302 } // Astro Redirects default to 302
	)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 403 })
	.addError(AuthAPIError, { status: 500 });
