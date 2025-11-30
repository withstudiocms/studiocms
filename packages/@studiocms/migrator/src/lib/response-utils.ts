export const jsonResponse = (data: unknown, status = 200) => {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
};
