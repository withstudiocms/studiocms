// @ts-expect-error: virtual module
import { componentProps } from 'test:component-registry';
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
	const components = componentProps;

	return new Response(JSON.stringify(components), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
