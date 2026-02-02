import { HttpApiEndpoint, HttpApiSchema } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { AuthAPIError } from '../errors.js';
import {
	AuthAPISuccess,
	JsonEmailPayload,
	JsonRegisterPayload,
	JsonUserPasswordPayload,
} from '../schemas.js';

/**
 * Endpoint for initiating forgot password process.
 *
 * @remarks
 * This endpoint sends a password reset email to the user if the email is registered.
 *
 * @returns A success message indicating that the password reset email has been sent
 * @throws {AuthAPIError} Returns a 400 status code for bad requests
 * @throws {AuthAPIError} Returns a 403 status code for forbidden access
 * @throws {AuthAPIError} Returns a 500 status code on server error
 */
export const forgotPasswordPost = HttpApiEndpoint.post('forgot-password', '/forgot-password')
	.annotate(Title, 'Forgot Password')
	.annotate(Summary, 'Initiate password reset process')
	.annotate(Description, 'Sends a password reset email to the user if the email is registered.')
	.setPayload(JsonEmailPayload)
	.addSuccess(AuthAPISuccess)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 403 })
	.addError(AuthAPIError, { status: 500 });

// TODO: Convert login to use JSON payload instead of multipart/form-data
// This is kept in the current spec as this is how it's currently implemented
// We should consider changing this in future versions as it's more standard to use JSON

/**
 * Endpoint for user login.
 *
 * @remarks
 * This endpoint authenticates the user with provided credentials and creates a session.
 * It accepts a multipart/form-data payload containing username and password.
 *
 * @returns A no-content response on successful login
 * @throws {AuthAPIError} Returns a 400 status code for bad requests
 * @throws {AuthAPIError} Returns a 403 status code for forbidden access
 * @throws {AuthAPIError} Returns a 500 status code on server error
 */
export const loginPost = HttpApiEndpoint.post('login', '/login')
	.annotate(Title, 'Login')
	.annotate(Summary, 'Authenticate user and create a session')
	.annotate(Description, 'Authenticates the user with provided credentials and creates a session.')
	.setPayload(HttpApiSchema.Multipart(JsonUserPasswordPayload))
	.addSuccess(
		HttpApiSchema.NoContent.annotations({
			description: 'Returns an empty response on successful login for frontend to handle.',
		}),
		{ status: 200 }
	)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 403 })
	.addError(AuthAPIError, { status: 500 });

/**
 * Endpoint for user logout.
 *
 * @remarks
 * This endpoint terminates the current user session.
 *
 * @returns A redirect response on successful logout
 * @throws {AuthAPIError} Returns a 500 status code on server error
 */
export const logoutPost = HttpApiEndpoint.post('logout', '/logout')
	.annotate(Title, 'Logout')
	.annotate(Summary, 'Terminate user session')
	.annotate(Description, 'Logs out the user by terminating the current session.')
	.addSuccess(
		Schema.Null.annotations({
			Description: 'Redirect... (Location header set to URL)',
		}),
		{ status: 303 }
	)
	.addError(AuthAPIError, { status: 500 });

// TODO: Convert register to use JSON payload instead of multipart/form-data
// This is kept in the current spec as this is how it's currently implemented
// We should consider changing this in future versions as it's more standard to use JSON

/**
 * Endpoint for user registration.
 *
 * @remarks
 * This endpoint allows new users to create an account by providing necessary details.
 * It accepts a multipart/form-data payload containing username, password, email, and display name.
 *
 * @returns A no-content response on successful registration
 * @throws {AuthAPIError} Returns a 400 status code for bad requests
 * @throws {AuthAPIError} Returns a 500 status code on server error
 */
export const registerPost = HttpApiEndpoint.post('register', '/register')
	.annotate(Title, 'Register')
	.annotate(Summary, 'Create a new user account')
	.annotate(Description, 'Registers a new user account with the provided details.')
	.setPayload(HttpApiSchema.Multipart(JsonRegisterPayload))
	.addSuccess(
		HttpApiSchema.NoContent.annotations({
			description: 'Returns an empty response on successful registration for frontend to handle.',
		}),
		{ status: 200 }
	)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 500 });
