import { HttpApiMiddleware, HttpApiSchema, HttpApiSecurity, OpenApi } from '@effect/platform';
import { Context, Schema } from 'effect';

/**
 * Represents an HTTP 401 Unauthorized error.
 *
 * This error is thrown when authentication is required but has failed or has not been provided.
 * It extends the Effect Schema's TaggedError with a 401 HTTP status code annotation.
 *
 * @remarks
 * This class is used in REST API middleware to indicate that the client must authenticate
 * itself to get the requested response.
 *
 * @example
 * ```typescript
 * throw new Unauthorized();
 * ```
 */
export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
	'Unauthorized',
	{},
	HttpApiSchema.annotations({ status: 401 })
) {}

/**
 * Represents a REST API user with authentication credentials and access level.
 *
 * @remarks
 * This class defines the structure for API users, including their unique identifier,
 * authentication key, and role-based rank within the system.
 *
 * @property userId - The unique identifier for the user
 * @property key - The authentication key/token for the user
 * @property rank - The user's access level, which can be one of: 'owner', 'admin', 'editor', 'visitor', or 'unknown'
 *
 * @example
 * ```typescript
 * const user = new RestAPIUser({
 *   userId: "user-123",
 *   key: "api-key-xyz",
 *   rank: "editor"
 * });
 * ```
 */
export class RestAPIUser extends Schema.Class<RestAPIUser>('RestAPIUser')({
	userId: Schema.String,
	key: Schema.String,
	rank: Schema.Literal('owner', 'admin', 'editor', 'visitor', 'unknown'),
}) {}

/**
 * Context tag for accessing the currently authenticated REST API user.
 *
 * This class provides a typed context tag that can be used with Effect's Context
 * system to inject and access the current REST API user throughout the application.
 *
 * @remarks
 * This is an Effect Context.Tag that enables dependency injection of the current
 * REST API user. Use this tag to access user information in Effect-based workflows.
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect';
 *
 * const getUser = Effect.gen(function* () {
 *   const user = yield* CurrentRestAPIUser;
 *   return user;
 * });
 * ```
 */
export class CurrentRestAPIUser extends Context.Tag('CurrentRestAPIUser')<
	CurrentRestAPIUser,
	RestAPIUser
>() {}

/**
 * Middleware for REST API authentication and authorization.
 *
 * This middleware handles bearer token authentication for the REST API endpoints.
 * When authentication fails, it returns an `Unauthorized` error response.
 * Upon successful authentication, it provides the `CurrentRestAPIUser` to downstream handlers.
 *
 * @remarks
 * The middleware uses HTTP bearer token security scheme for authentication.
 * The security scheme is documented in OpenAPI specification as "REST API Bearer Token Authentication".
 *
 * @see {@link HttpApiMiddleware.Tag} for the base middleware implementation
 * @see {@link CurrentRestAPIUser} for the authenticated user context
 * @see {@link Unauthorized} for the failure response type
 */
export class RestAPIAuthorization extends HttpApiMiddleware.Tag<RestAPIAuthorization>()(
	'RestAPIAuthorization',
	{
		failure: Unauthorized,
		provides: CurrentRestAPIUser,
		security: {
			token: HttpApiSecurity.bearer.pipe(
				HttpApiSecurity.annotate(OpenApi.Description, 'REST API Bearer Token Authentication')
			),
		},
	}
) {}
