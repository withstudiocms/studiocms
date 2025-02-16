import type { APIContext } from 'astro';

const getAuthToken = (headerString?: string | null) => {
	if (!headerString) {
		return null;
	}

	const parts = headerString.split(' ');

	if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
		return null;
	}

	return parts[1];
};

export async function verifyAuthToken(context: APIContext) {
	const authToken = getAuthToken(context.request.headers.get('Authorization'));

	if (!authToken) {
		return {
			status: 401,
			body: {
				error: 'Invalid token',
			},
		};
	}

	return {
		status: 200,
		body: {
			token: authToken,
			userId: '123',
			rank: 'admin',
		},
	};
}
