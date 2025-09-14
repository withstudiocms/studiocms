// @ts-expect-error: virtual module
import { config } from 'virtual:test-config';
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
	return new Response(JSON.stringify(config), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
