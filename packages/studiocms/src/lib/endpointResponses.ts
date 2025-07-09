export const OptionsResponse = (allow: string[]) =>
	new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: `OPTIONS, ${allow.join(', ')}`,
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});

export const AllResponse = () =>
	new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
	});
