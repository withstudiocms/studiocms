import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { SDKCore } from 'studiocms:sdk';
import type { APIRoute } from 'astro';
import {
	AllResponse,
	defineAPIRoute,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

export const POST: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/api-tokens.POST')(function* () {
			const sdk = yield* SDKCore;

			// Check if demo mode is enabled
			if (developerConfig.demoMode !== false) {
				return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
			}

			// Get user data
			const userData = ctx.locals.StudioCMS.security?.userSessionData;

			// Check if user is logged in
			if (!userData?.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isEditor;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Get Json Data
			const jsonData: { description: string; user: string } = yield* Effect.tryPromise({
				try: () => ctx.request.json(),
				catch: () => new Error('Invalid JSON in request body'),
			});

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
		})
	);

export const DELETE: APIRoute = async (c) =>
	defineAPIRoute(c)((ctx) =>
		genLogger('studiocms/routes/api/dashboard/api-tokens.DELETE')(function* () {
			const sdk = yield* SDKCore;

			// Check if demo mode is enabled
			if (developerConfig.demoMode !== false) {
				return apiResponseLogger(403, 'Demo mode is enabled, this action is not allowed.');
			}

			// Get user data
			const userData = ctx.locals.StudioCMS.security?.userSessionData;

			// Check if user is logged in
			if (!userData?.isLoggedIn) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Check if user has permission
			const isAuthorized = ctx.locals.StudioCMS.security?.userPermissionLevel.isEditor;
			if (!isAuthorized) {
				return apiResponseLogger(403, 'Unauthorized');
			}

			// Get Json Data
			const jsonData: { tokenID: string; userID: string } = yield* Effect.tryPromise({
				try: () => ctx.request.json(),
				catch: () => new Error('Invalid JSON in request body'),
			});

			// Validate form data
			if (!jsonData.tokenID) {
				return apiResponseLogger(400, 'Invalid form data, tokenID is required');
			}

			if (!jsonData.userID) {
				return apiResponseLogger(400, 'Invalid form data, userID is required');
			}

			yield* sdk.REST_API.tokens.delete(jsonData.userID, jsonData.tokenID);

			return apiResponseLogger(200, 'Token deleted');
		})
	);

export const OPTIONS: APIRoute = async () =>
	OptionsResponse({ allowedMethods: ['POST', 'DELETE'] });

export const ALL: APIRoute = async () => AllResponse();
