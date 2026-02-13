import { HttpApiMiddleware, HttpApiSchema } from '@effect/platform';
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
	permissionLevel: Schema.Literal('owner', 'admin', 'editor', 'viewer', 'unknown'),
	user: Schema.NullOr(StudioCMSUsersTable.Select),
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
	}
) {}
