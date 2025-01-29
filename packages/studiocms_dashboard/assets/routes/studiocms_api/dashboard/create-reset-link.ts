import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { simpleResponse } from '../../../utils/simpleResponse';

export const POST: APIRoute = async (ctx: APIContext): Promise<Response> => {
	const jsonData = await ctx.request.json();

	const { userId } = jsonData;

	if (!userId) {
		return simpleResponse(400, 'Invalid form data, userId is required');
	}

	const token = await studioCMS_SDK.resetTokenBucket.new(userId);

	if (!token) {
		return simpleResponse(500, 'Failed to create reset link');
	}

	return new Response(JSON.stringify(token), {
		headers: {
			'content-type': 'application/json',
		},
		status: 200,
	});
};
