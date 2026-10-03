/**
 * This module defines the Astro context for the StudioCMS API specifications. It includes the data structures and middleware necessary to extract user session information from Astro's locals and provide it in the context for API routes. This allows API routes to access user session data and enforce authentication and authorization based on that data.
 */

import { HttpApiMiddleware, HttpApiSchema, HttpApiSecurity, OpenApi } from '@effect/platform';
import { StudioCMSUsersTable } from '@withstudiocms/sdk/tables';
import * as Context from 'effect/Context';
import * as Schema from 'effect/Schema';
import { AstroAPIContext } from 'effectify/astro/context';

export { AstroAPIContext };

/**
 * Session data structure extracted from Astro locals.
 */
export class LocalsSessionData extends Schema.Class<LocalsSessionData>('LocalsSessionData')({
	isLoggedIn: Schema.Boolean,
	permissionLevel: Schema.Literal('owner', 'admin', 'editor', 'visitor', 'unknown'),
	user: Schema.NullOr(StudioCMSUsersTable.Select),
	userPermissionLevel: Schema.Struct({
		isVisitor: Schema.Boolean,
		isEditor: Schema.Boolean,
		isAdmin: Schema.Boolean,
		isOwner: Schema.Boolean,
	}),
}) {}

/**
 * Error thrown when Astro locals are missing or invalid.
 *
 * @remarks
 * This error indicates that the required Astro locals for user session data
 * are not present or the user is not authenticated.
 */
export class AstroLocalsMissing extends Schema.TaggedError<AstroLocalsMissing>()(
	'AstroLocalsMissing',
	{},
	HttpApiSchema.annotations({
		status: 401,
		description: 'Astro locals are missing or invalid. (User is not authenticated.)',
	})
) {}

/**
 * A Context Tag representing the current user session data extracted from Astro locals.
 */
export class CurrentUser extends Context.Tag('CurrentUser')<CurrentUser, LocalsSessionData>() {}

/**
 * Middleware to extract user session data from Astro locals and provide it in the context.
 *
 * @remarks
 * This middleware checks the Astro locals for user session data. If the user is not logged in,
 * it throws an `AstroLocalsMissing` error. If the user is logged in, it provides the user session
 * data in the context under the `CurrentUser` tag.
 */
export class AstroLocalsMiddleware extends HttpApiMiddleware.Tag<AstroLocalsMiddleware>()(
	'AstroLocalsMiddleware',
	{
		failure: AstroLocalsMissing,
		provides: CurrentUser,
		optional: false,
		security: {
			localUser: HttpApiSecurity.apiKey({ key: 'AstroLocalUser' }).pipe(
				HttpApiSecurity.annotate(
					OpenApi.Description,
					"Astro Locals User Authentication (Uses Astro's Middleware provided locals)"
				)
			),
		},
	}
) {}
