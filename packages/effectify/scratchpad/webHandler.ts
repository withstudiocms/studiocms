import { HttpApiToAstroRoute } from '../src/astro/HttpApi';
import { EffectHttpHandlerToHttpApi, webHandlerToEffectHttpHandler } from '../src/webHandler';

// Example of converting a standard web handler to an Effect API and then to an Astro API route handler
const mockWebHandler = async (request: Request) => {
	console.log('Received request:', request);
	return new Response('Hello from mock web handler!', { status: 200 });
};

// Convert the mock web handler to an Effect API handler
const EffectHttpHandler = webHandlerToEffectHttpHandler(mockWebHandler);

// Convert the Effect API handler to an EffectApiHandler that can be used with HttpApiBuilder
const EffectHttpApiHandler = EffectHttpHandlerToHttpApi('*', EffectHttpHandler);

// Finally, convert the Effect API to an Astro API route handler
const _AstroAPIRoute = HttpApiToAstroRoute(EffectHttpApiHandler);
