import { HttpApiEndpoint, HttpApiSchema } from '@effect/platform';
import { Description, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	APISafeUserFields,
	CombinedUserDataSchema,
	RestUsersIdJSONData,
	RestUsersIndexJSONData,
	SuccessResponse,
	UsersV1GetSearchParams,
} from '../../schemas.js';

/**
 * GET /users
 * Retrieves a list of users.
 */
export const UsersIndexGet = HttpApiEndpoint.get('UsersIndexGet', '/users')
	.annotate(Title, 'Get Users')
	.annotate(
		Description,
		'Retrieves a list of users, with optional filtering by username, name, and rank.'
	)
	.setUrlParams(UsersV1GetSearchParams)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Array(CombinedUserDataSchema))
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * POST /users
 * Creates a new user.
 */
export const UsersIndexPost = HttpApiEndpoint.post('UsersIndexPost', '/users')
	.annotate(Title, 'Create User')
	.annotate(Description, 'Creates a new user.')
	.setPayload(RestUsersIndexJSONData)
	.middleware(RestAPIAuthorization)
	.addSuccess(CombinedUserDataSchema)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 403 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /users
 * Provides information about the /users endpoint.
 */
export const UsersIndexOptions = HttpApiEndpoint.options('UsersIndexOptions', '/users')
	.annotate(Title, 'Options for Users')
	.annotate(
		Description,
		'Provides information about the /users endpoint, including allowed methods.'
	)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });

/**
 * GET /users/{id}
 * Retrieves a user by their ID.
 */
export const UsersByIdGet = HttpApiEndpoint.get(
	'UsersByIdGet',
	`/users/${HttpApiSchema.param('id', Schema.String)}`
)
	.annotate(Title, 'Get User by ID')
	.annotate(Description, 'Retrieves a user by their ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(APISafeUserFields)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 401 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * PATCH /users/{id}
 * Updates a user by their ID.
 */
export const UsersByIdPatch = HttpApiEndpoint.patch(
	'UsersByIdPatch',
	`/users/${HttpApiSchema.param('id', Schema.String)}`
)
	.annotate(Title, 'Update User by ID')
	.annotate(Description, 'Updates a user by their ID.')
	.setPayload(RestUsersIdJSONData)
	.middleware(RestAPIAuthorization)
	.addSuccess(APISafeUserFields)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 401 })
	.addError(RestAPIError, { status: 403 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * DELETE /users/{id}
 * Deletes a user by their ID.
 */
export const UsersByIdDelete = HttpApiEndpoint.del(
	'UsersByIdDelete',
	`/users/${HttpApiSchema.param('id', Schema.String)}`
)
	.annotate(Title, 'Delete User by ID')
	.annotate(Description, 'Deletes a user by their ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(SuccessResponse)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 401 })
	.addError(RestAPIError, { status: 403 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });

/**
 * OPTIONS /users/{id}
 * Provides information about the /users/{id} endpoint.
 */
export const UsersByIdOptions = HttpApiEndpoint.options(
	'UsersByIdOptions',
	`/users/${HttpApiSchema.param('id', Schema.String)}`
)
	.annotate(Title, 'Options for User by ID')
	.annotate(
		Description,
		'Provides information about the /users/{id} endpoint, including allowed methods.'
	)
	.middleware(RestAPIAuthorization)
	.addSuccess(Schema.Void)
	.addError(RestAPIError, { status: 500 });
