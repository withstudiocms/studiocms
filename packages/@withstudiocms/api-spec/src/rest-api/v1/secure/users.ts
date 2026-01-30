import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { Schema } from 'effect';
import { RestAPIError } from '../../errors';
import { RestAPIAuthorization } from '../../middleware.js';
import {
	APISafeUserFields,
	CombinedUserDataSchema,
	IdParamString,
	RestUsersIdJSONData,
	RestUsersIndexJSONData,
	SuccessResponse,
	UsersV1GetSearchParams,
} from '../../schemas.js';

/**
 * GET /users
 * Retrieves a list of users.
 */
export const UsersIndexGet = HttpApiEndpoint.get('get-users', '/users')
	.annotate(Title, 'Get Users')
	.annotate(Summary, 'Retrieve Users')
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
export const UsersIndexPost = HttpApiEndpoint.post('create-user', '/users')
	.annotate(Title, 'Create User')
	.annotate(Summary, 'Create User')
	.annotate(Description, 'Creates a new user.')
	.setPayload(RestUsersIndexJSONData)
	.middleware(RestAPIAuthorization)
	.addSuccess(CombinedUserDataSchema)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 403 })
	.addError(RestAPIError, { status: 500 });

/**
 * GET /users/{id}
 * Retrieves a user by their ID.
 */
export const UsersByIdGet = HttpApiEndpoint.get('get-user', '/users/:id')
	.setPath(IdParamString)
	.annotate(Title, 'Get User by ID')
	.annotate(Summary, 'Retrieve User by ID')
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
export const UsersByIdPatch = HttpApiEndpoint.patch('update-user', '/users/:id')
	.setPath(IdParamString)
	.annotate(Title, 'Update User by ID')
	.annotate(Summary, 'Update User by ID')
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
export const UsersByIdDelete = HttpApiEndpoint.del('delete-user', '/users/:id')
	.setPath(IdParamString)
	.annotate(Title, 'Delete User by ID')
	.annotate(Summary, 'Delete User by ID')
	.annotate(Description, 'Deletes a user by their ID.')
	.middleware(RestAPIAuthorization)
	.addSuccess(SuccessResponse)
	.addError(RestAPIError, { status: 400 })
	.addError(RestAPIError, { status: 401 })
	.addError(RestAPIError, { status: 403 })
	.addError(RestAPIError, { status: 404 })
	.addError(RestAPIError, { status: 500 });
