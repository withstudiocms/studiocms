import { apiResponseLogger } from 'studiocms:logger';
import type { APIContext, APIRoute } from 'astro';
import { Cause, convertToVanilla, Effect, genLogger, ParseResult, Schema } from 'studiocms/effect';
import { AllResponse, OptionsResponse } from 'studiocms/lib/endpointResponses';
import { UseSDK } from '../lib/db.js';

/**
 * Schema definition for validating the GET request parameters.
 *
 * @property projectId - The unique identifier of the project as a string.
 */
const GETJsonSchema = Schema.Struct({
	projectId: Schema.String,
});

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
 * Parses and validates the JSON body of a GET request using the provided API context.
 *
 * This function attempts to read the JSON payload from the request, decode it using the
 * `GETJsonSchema`, and handle any parsing or validation errors gracefully. If an error occurs
 * during parsing or schema validation, it maps the error to a more descriptive `Error` instance.
 *
 * @param context - The API context containing the request to parse.
 * @returns An `Effect` that resolves to the decoded data if successful, or fails with an error if parsing or validation fails.
 */
const parseGETJsonRequest = (context: APIContext) =>
	Effect.tryPromise(() => context.request.json()).pipe(
		Effect.flatMap((data) => Schema.decodeUnknown(GETJsonSchema)(data)),
		Effect.mapError((error) => {
			console.error('Error parsing GET JSON request:', error);
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
 * Handles GET requests for loading project data in the WYSIWYG store route.
 *
 * This API route performs the following actions:
 * - Retrieves the SDK instance.
 * - Checks if the user is logged in and has editor permissions.
 * - Parses the incoming GET request JSON for the `projectId`.
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

			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isEditor;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Parse the request JSON
			const { projectId } = yield* parseGETJsonRequest(context);

			// Load the project data using the SDK
			const projectData = yield* load(projectId);

			if (!projectData) {
				return apiResponseLogger(404, 'Project not found');
			}

			// Return the project data as a JSON response
			return new Response(JSON.stringify(projectData), {
				headers: { 'Content-Type': 'application/json' },
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

			// Get user data
			const userData = context.locals.userSessionData;

			// Check if user is logged in
			if (!userData.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = context.locals.userPermissionLevel.isEditor;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Parse the request JSON
			const { projectId, data } = yield* parsePOSTJsonRequest(context, types._Schema);

			// Store the project data using the SDK
			const result = yield* store(projectId, data);

			if (!result) {
				return apiResponseLogger(500, 'Failed to store project data');
			}

			// Return a success response
			return apiResponseLogger(200, 'Project data stored successfully');
		})
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['GET', 'POST']);

export const ALL: APIRoute = async () => AllResponse();
