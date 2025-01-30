import type { APIRoute } from 'astro';

// TODO: Implement this route

export const POST: APIRoute = async () => {
	return new Response(JSON.stringify({ message: 'Not implemented' }), {
		headers: {
			'content-type': 'application/json',
		},
		status: 501,
	});
};

export const PATCH: APIRoute = async () => {
	return new Response(JSON.stringify({ message: 'Not implemented' }), {
		headers: {
			'content-type': 'application/json',
		},
		status: 501,
	});
};

export const DELETE: APIRoute = async () => {
	return new Response(JSON.stringify({ message: 'Not implemented' }), {
		headers: {
			'content-type': 'application/json',
		},
		status: 501,
	});
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST, DELETE, PATCH',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
