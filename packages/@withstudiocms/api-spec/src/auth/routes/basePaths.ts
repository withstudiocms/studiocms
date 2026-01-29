import { HttpApiEndpoint, HttpApiSchema } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { AuthAPIError } from '../errors.js';
import { AuthAPISuccess } from '../schemas.js';

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
export const forgotPasswordPost = HttpApiEndpoint.post('forgotPasswordPost', '/forgot-password')
	.annotate(Title, 'Forgot Password')
	.annotate(Summary, 'Initiate password reset process')
	.annotate(Description, 'Sends a password reset email to the user if the email is registered.')
	.setPayload(
		Schema.Struct({
			email: Schema.String,
		})
	)
	.addSuccess(AuthAPISuccess)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 403 })
	.addError(AuthAPIError, { status: 500 });

/**
 * Options endpoint for forgot password.
 *
 * @remarks
 * This endpoint provides metadata about the forgot password endpoint,
 * including allowed HTTP methods and capabilities.
 *
 * @returns A void response on success
 * @throws {AuthAPIError} When a server error occurs (HTTP 500)
 */
export const forgotPasswordOptions = HttpApiEndpoint.options(
	'forgotPasswordOptions',
	'/forgot-password'
)
	.annotate(Title, 'Options for Forgot Password')
	.annotate(Summary, 'Retrieve Forgot Password Options')
	.annotate(Description, 'Provides options for the forgot password endpoint.')
	.addSuccess(Schema.Void)
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
export const loginPost = HttpApiEndpoint.post('loginPost', '/login')
	.annotate(Title, 'Login')
	.annotate(Summary, 'Authenticate user and create a session')
	.annotate(Description, 'Authenticates the user with provided credentials and creates a session.')
	.setPayload(
		HttpApiSchema.Multipart(
			Schema.Struct({
				username: Schema.String,
				password: Schema.String,
			})
		)
	)
	.addSuccess(HttpApiSchema.NoContent)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 403 })
	.addError(AuthAPIError, { status: 500 });

/**
 * Options endpoint for user login.
 *
 * @remarks
 * This endpoint provides metadata about the login endpoint,
 * including allowed HTTP methods and capabilities.
 *
 * @returns A void response on success
 * @throws {AuthAPIError} When a server error occurs (HTTP 500)
 */
export const loginOptions = HttpApiEndpoint.options('loginOptions', '/login')
	.annotate(Title, 'Options for Login')
	.annotate(Summary, 'Retrieve Login Options')
	.annotate(Description, 'Provides options for the login endpoint.')
	.addSuccess(Schema.Void)
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
export const logoutPost = HttpApiEndpoint.post('logoutPost', '/logout')
	.annotate(Title, 'Logout')
	.annotate(Summary, 'Terminate user session')
	.annotate(Description, 'Logs out the user by terminating the current session.')
	.addSuccess(Schema.String, { status: 303 })
	.addError(AuthAPIError, { status: 500 });

/**
 * Options endpoint for user logout.
 *
 * @remarks
 * This endpoint provides metadata about the logout endpoint,
 * including allowed HTTP methods and capabilities.
 *
 * @returns A void response on success
 * @throws {AuthAPIError} When a server error occurs (HTTP 500)
 */
export const logoutOptions = HttpApiEndpoint.options('logoutOptions', '/logout')
	.annotate(Title, 'Options for Logout')
	.annotate(Summary, 'Retrieve Logout Options')
	.annotate(Description, 'Provides options for the logout endpoint.')
	.addSuccess(Schema.Void)
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
export const registerPost = HttpApiEndpoint.post('registerPost', '/register')
	.annotate(Title, 'Register')
	.annotate(Summary, 'Create a new user account')
	.annotate(Description, 'Registers a new user account with the provided details.')
	.setPayload(
		HttpApiSchema.Multipart(
			Schema.Struct({
				username: Schema.String,
				password: Schema.String,
				email: Schema.String,
				displayname: Schema.String,
			})
		)
	)
	.addSuccess(HttpApiSchema.NoContent)
	.addError(AuthAPIError, { status: 400 })
	.addError(AuthAPIError, { status: 500 });

/**
 * Options endpoint for user registration.
 *
 * @remarks
 * This endpoint provides metadata about the registration endpoint,
 * including allowed HTTP methods and capabilities.
 *
 * @returns A void response on success
 * @throws {AuthAPIError} When a server error occurs (HTTP 500)
 */
export const registerOptions = HttpApiEndpoint.options('registerOptions', '/register')
	.annotate(Title, 'Options for Register')
	.annotate(Summary, 'Retrieve Register Options')
	.annotate(Description, 'Provides options for the register endpoint.')
	.addSuccess(Schema.Void)
	.addError(AuthAPIError, { status: 500 });
