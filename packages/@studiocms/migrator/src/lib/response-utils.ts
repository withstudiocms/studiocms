/**
 * Creates a JSON Response with the given data and status code.
 * @param data - The data to be included in the response body.
 * @param status - The HTTP status code (default is 200).
 * @returns A Response object with JSON content.
 */
export const jsonResponse = (data: unknown, status = 200) => {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
};
