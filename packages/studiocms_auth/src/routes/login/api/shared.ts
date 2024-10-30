export function parseFormDataEntryToString(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	if (typeof value !== 'string') {
		return null;
	}
	return value;
}

export const badFormDataEntry = new Response(JSON.stringify({ error: 'Invalid form data' }), {
	status: 400,
	statusText: 'Bad Request',
});
