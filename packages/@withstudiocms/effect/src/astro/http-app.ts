import { HttpApp, type HttpMiddleware } from '@effect/platform';
import type { APIContext, APIRoute } from 'astro';
import { Context } from 'effect';

/**
 * A Context Reference for Astro API route locals.
 */
export class AstroAPIContext extends Context.Reference<AstroAPIContext>()('AstroAPIContext', {
	defaultValue: () => ({}) as APIContext,
}) {}

/**
 * Converts an Effect HttpApp into an Astro API route handler.
 *
 * @param app - The Effect HttpApp to convert.
 * @param middleware - Optional middleware to apply to the HttpApp.
 * @returns An Astro APIRoute handler.
 */
export const makeAstroEndpoint = <E>(
	app: HttpApp.Default<E>,
	middleware?: HttpMiddleware.HttpMiddleware | undefined
): APIRoute => {
	// Create a web handler from the HttpApp and middleware
	const handler = HttpApp.toWebHandler(app, middleware);

	// Return the Astro API route handler
	return async (context) => {
		// Create a Context with the current Astro API context
		const localsContext = Context.make(AstroAPIContext, context);
		try {
			// Handle the request using the generated handler
			return await handler(context.request, localsContext);
		} catch (error) {
			// Log and rethrow any errors that occur during request handling
			console.error('Error handling request:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	};
};
