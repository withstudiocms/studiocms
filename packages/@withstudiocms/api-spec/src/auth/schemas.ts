import * as Schema from 'effect/Schema';

/**
 * Standard success response schema for the StudioCMS Auth API.
 *
 * @remarks
 * This schema defines the structure of success responses returned by the API.
 * It includes a single property:
 * - `message`: A string message indicating the success of the operation.
 */
export const AuthAPISuccess = Schema.Struct({
	message: Schema.String,
});

/**
 * Standard error response schema for the StudioCMS Auth API.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export const AuthAPIErrorSchema = Schema.Struct({
	error: Schema.String,
});

/**
 * Path parameter for OAuth provider.
 */
export const OAuthProviderParam = Schema.Struct({
	provider: Schema.String,
});

/**
 * JSON payload schema for email-based requests.
 */
export const JsonEmailPayload = Schema.Struct({
	email: Schema.String,
});

/**
 * JSON payload schema for username and password-based requests.
 */
export const JsonUserPasswordPayload = Schema.Struct({
	username: Schema.String,
	password: Schema.String,
});

/**
 * JSON payload schema for user registration requests.
 */
export const JsonRegisterPayload = Schema.Struct({
	...JsonEmailPayload.fields,
	...JsonUserPasswordPayload.fields,
	displayname: Schema.String,
});
