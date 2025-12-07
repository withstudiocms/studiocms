import type { MiddlewareHandler } from 'astro';

/**
 * Middleware which adds the web vitals `<meta>` tag to each page’s `<head>`.
 *
 * @example
 * <meta name="x-studiocms-vitals-route" content="/blog/[slug]" />
 */
export const onRequest: MiddlewareHandler = async ({ params, url }, next) => {
	const response = await next();
	const contentType = response.headers.get('Content-Type');
	if (!contentType?.startsWith('text/html')) return response;
	if (!response.body) {
		return response;
	}

	const webVitalsMetaTag = getMetaTag(url, params);
	const transformedBody = response.body
		.pipeThrough(new TextDecoderStream())
		.pipeThrough(HeadInjectionTransformStream(webVitalsMetaTag))
		.pipeThrough(new TextEncoderStream());

	return new Response(transformedBody, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});
};

/** TransformStream which injects the passed HTML just before the closing </head> tag.  */
function HeadInjectionTransformStream(htmlToInject: string) {
	let hasInjected = false;
	return new TransformStream({
		transform: (chunk, controller) => {
			if (!hasInjected) {
				const headCloseIndex = chunk.indexOf('</head>');
				if (headCloseIndex > -1) {
					chunk = chunk.slice(0, headCloseIndex) + htmlToInject + chunk.slice(headCloseIndex);
					hasInjected = true;
				}
			}
			controller.enqueue(chunk);
		},
	});
}

/** Get a `<meta>` tag to identify the current Astro route. */
function getMetaTag(url: URL, params: Record<string, string | undefined>) {
	let route = url.pathname;
	for (const [key, value] of Object.entries(params)) {
		if (value) route = route.replace(value, `[${key}]`);
	}
	route = miniEncodeAttribute(stripTrailingSlash(route));
	return `<meta name="x-studiocms-vitals-route" content="${route}" />`;
}

function stripTrailingSlash(str: string) {
	return str.length > 1 && str.at(-1) === '/' ? str.slice(0, -1) : str;
}

function miniEncodeAttribute(str: string) {
	return str
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}
