import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/api-tokens.POST')(function* () {
			const sdk = yield* SDKCore;

			// Check if demo mode is enabled
			if (developerConfig.demoMode !== false) {
				return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
			}

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

			// Get Json Data
			const jsonData: { description: string; user: string } = yield* Effect.tryPromise(() =>
				context.request.json()
			);

			// Validate form data
			if (!jsonData.description) {
				return apiResponseLogger(400, 'Invalid form data, description is required');
			}

			if (!jsonData.user) {
				return apiResponseLogger(400, 'Invalid form data, user is required');
			}

			const newToken = yield* sdk.REST_API.tokens.new(jsonData.user, jsonData.description);

			return new Response(JSON.stringify({ token: newToken.key }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			});
		}).pipe(SDKCore.Provide)
	);

export const DELETE: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms/routes/api/dashboard/api-tokens.DELETE')(function* () {
			const sdk = yield* SDKCore;

			// Check if demo mode is enabled
			if (developerConfig.demoMode !== false) {
				return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
			}

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

			// Get Json Data
			const jsonData: { tokenID: string; userID: string } = yield* Effect.tryPromise(() =>
				context.request.json()
			);

			// Validate form data
			if (!jsonData.tokenID) {
				return apiResponseLogger(400, 'Invalid form data, tokenID is required');
			}

			if (!jsonData.userID) {
				return apiResponseLogger(400, 'Invalid form data, userID is required');
			}

			yield* sdk.REST_API.tokens.delete(jsonData.userID, jsonData.tokenID);

			return apiResponseLogger(200, 'Token deleted');
		}).pipe(SDKCore.Provide)
	);

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST', 'DELETE']);

export const ALL: APIRoute = async () => AllResponse();
