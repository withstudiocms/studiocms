export const simpleResponse = (statusCode: number, message: string) => {
	if (statusCode !== 200) {
		return new Response(
			JSON.stringify({
				error: message,
			}),
			{
				headers: {
					'Content-Type': 'application/json',
				},
				status: statusCode,
			}
		);
	}
	return new Response(
		JSON.stringify({
			message: message,
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
			status: statusCode,
		}
	);
};
