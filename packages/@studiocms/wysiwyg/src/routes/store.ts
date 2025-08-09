import { apiResponseLogger } from 'studiocms:logger';
import type { APIContext, APIRoute } from 'astro';
import { Cause, convertToVanilla, Effect, genLogger, ParseResult, Schema } from 'studiocms/effect';
import { AllResponse, OptionsResponse } from 'studiocms/lib/endpointResponses';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../consts.js';
import { UseSDK } from '../lib/db.js';

/**
 * Creates a JSON schema for a POST request payload containing a `projectId` and mutable `data` field.
 *
 * @template S - The type of the schema for the `data` field, extending `Schema.Struct<any>`.
 * @param schema - The schema definition for the `data` property.
 * @returns A new schema struct with `projectId` as a string and `data` as a mutable version of the provided schema.
 */
// biome-ignore lint/suspicious/noExplicitAny: Allows for flexible schema definitions
const POSTJsonSchema = <S extends Schema.Struct<any>>(schema: S) =>
	Schema.Struct({
		projectId: Schema.String,
		data: Schema.mutable(schema),
	});

/**
 * Parses and validates the JSON body of a POST request using a provided schema.
 *
 * @template S - The schema type extending `Schema.Struct<any>`.
 * @param context - The API context containing the request object.
 * @param schema - The schema used to validate and decode the request body.
 * @returns An `Effect` that resolves with the validated data or rejects with a descriptive error.
 *
 * @remarks
 * - Attempts to parse the request body as JSON and validate it against the given schema.
 * - On validation failure, returns an error with a detailed message.
 * - Handles unknown exceptions and logs errors to the console.
 */
// biome-ignore lint/suspicious/noExplicitAny: Allows for flexible schema definitions
const parsePOSTJsonRequest = <S extends Schema.Struct<any>>(context: APIContext, schema: S) =>
	Effect.tryPromise(() => context.request.json()).pipe(
		Effect.flatMap((data) => Schema.decodeUnknown(POSTJsonSchema(schema))(data)),
		Effect.mapError((error) => {
			console.error('Error parsing POST JSON request:', error);
			if (error instanceof ParseResult.ParseError) {
				return new Error(`Invalid request data: ${error.message}`);
			}
			if (error instanceof Cause.UnknownException) {
				return new Error(`Unknown error occurred: ${error.message}`);
			}
			return new Error('Failed to parse request data: Unknown error');
		})
	);

/**
 * Validates the CSRF token from the request headers against the stored token in cookies.
 *
 * @param context - The API context containing the request and cookies.
 * @returns An Effect that throws a 403 Response if the CSRF token is invalid or missing.
 */
const handleCSRF = ({ request, cookies }: APIContext) =>
	Effect.try(() => {
		const submittedToken = request.headers.get(CSRF_HEADER_NAME);
		const storedToken = cookies.get(CSRF_COOKIE_NAME)?.value;

		if (!submittedToken || !storedToken || submittedToken !== storedToken) {
			return apiResponseLogger(403, 'CSRF token validation failed');
		}
	});

/**
 * Verifies the user's session and authorization level.
 *
 * This function checks if the user is logged in and has editor permissions.
 * If the user is not logged in or lacks the required permissions, it returns a 403 Unauthorized response.
 *
 * @param locals - The API context containing user session data and permission level.
 * @returns An effect that either allows further processing or returns a 403 Unauthorized response.
 */
const handleUserSessionVerification = ({ locals }: APIContext) =>
	Effect.try(() => {
		// Get user data
		const userData = locals.userSessionData;

		// Check if user is logged in
		if (!userData.isLoggedIn) {
			return apiResponseLogger(403, 'Unauthorized');
		}

		// Check if user has permission
		const isAuthorized = locals.userPermissionLevel.isEditor;
		if (!isAuthorized) {
			return apiResponseLogger(403, 'Unauthorized');
		}
	});

/**
 * Performs API checks for user session verification and CSRF validation.
 *
 * This generator function sequentially verifies the user's session and the CSRF token.
 * If either check fails, it returns the corresponding `Response` object (e.g., unauthorized or CSRF error).
 * If both checks pass, it returns `undefined`, allowing further processing.
 *
 * @param context - The API context containing request and session information.
 * @returns A `Response` object if a check fails, or `undefined` if all checks pass.
 */
const apiChecks = Effect.fn(function* (context: APIContext) {
	const userCheck = yield* handleUserSessionVerification(context);
	if (userCheck instanceof Response) {
		return userCheck; // Return the unauthorized response if user check fails
	}
	const csrfCheck = yield* handleCSRF(context);
	if (csrfCheck instanceof Response) {
		return csrfCheck; // Return the CSRF error response if validation fails
	}
	return undefined;
});

/**
 * Handles GET requests for loading project data in the WYSIWYG store route.
 *
 * This API route performs the following actions:
 * - Retrieves the SDK instance.
 * - Checks if the user is logged in and has editor permissions.
 * - Extracts the `projectId` from the URL search parameters.
 * - Loads the project data using the SDK.
 * - Returns the project data as a JSON response if found.
 * - Returns appropriate error responses for unauthorized access or missing projects.
 *
 * @param context - The API context containing request and user session information.
 * @returns A `Response` object with the project data as JSON, or an error response.
 */
export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('@studiocms/wysiwyg/routes/store:GET')(function* () {
			const { load } = yield* UseSDK;

			// Ensure the user is logged in and has the necessary permissions
			// This is done to prevent unauthorized access to project data
			// as well as CSRF validation
			const securityCheck = yield* apiChecks(context);
			if (securityCheck instanceof Response) {
				return securityCheck; // Return the unauthorized response if security check fails
			}

			const searchParams = context.url.searchParams;

			// If the request has a projectId in the search params, use it
			const projectId = searchParams.get('projectId');

			// If no projectId is provided, return an error response
			if (!projectId) {
				return apiResponseLogger(400, 'Project ID is required');
			}

			// Load the project data using the SDK
			const projectData = yield* load(projectId);

			// If no project data is found, return a 404 error
			if (!projectData) {
				return apiResponseLogger(404, 'Project not found');
			}

			// Return the project data as a JSON response
			return new Response(JSON.stringify(projectData), {
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-store, private',
				},
			});
		})
	);

/**
 * Handles the POST request for storing project data in the WYSIWYG route.
 *
 * This API route performs the following steps:
 * - Retrieves the SDK instance.
 * - Checks if the user is logged in and has editor permissions.
 * - Parses the incoming JSON request for project data.
 * - Stores the project data using the SDK.
 * - Returns an appropriate API response based on the operation result.
 *
 * @param context - The API context containing request and user session information.
 * @returns An API response indicating success or failure of the store operation.
 */
export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('@studiocms/wysiwyg/routes/store:POST')(function* () {
			const { store, types } = yield* UseSDK;

			// Ensure the user is logged in and has the necessary permissions
			// This is done to prevent unauthorized access to project data
			// as well as CSRF validation
			const securityCheck = yield* apiChecks(context);
			if (securityCheck instanceof Response) {
				return securityCheck; // Return the unauthorized response if security check fails
			}

			// Parse the request JSON
			const { projectId, data } = yield* parsePOSTJsonRequest(context, types._Schema);

			// Store the project data using the SDK
			const result = yield* store(projectId, data);

			// If the result is null or undefined, return an error response
			if (!result) {
				return apiResponseLogger(500, 'Failed to store project data');
			}

			// Return a success response
			return apiResponseLogger(200, 'Project data stored successfully');
		})
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET', 'POST']);

export const ALL: APIRoute = async () => AllResponse();
