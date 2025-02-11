export function parseFormDataEntryToString(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	if (typeof value !== 'string') {
		return null;
	}
	return value;
}

export const badFormDataEntry = (title: string, description: string): Response => {
	return new Response(JSON.stringify({ error: { title, description } }), {
		status: 400,
		statusText: 'Bad Request',
		headers: {
			'Content-Type': 'application/json',
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
