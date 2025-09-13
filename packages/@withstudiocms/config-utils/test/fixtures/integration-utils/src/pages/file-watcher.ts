// @ts-expect-error: virtual module
import { reports } from 'virtual:test-reports';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(reports), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
};
