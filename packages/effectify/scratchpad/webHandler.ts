import { HttpApiToAstroRoute } from '../src/astro/HttpApi';
import { EffectHttpHandlerToHttpApi, webHandlerToEffectHttpHandler } from '../src/webHandler';

const mockWebHandler = async (request: Request) => {
	console.log('Received request:', request);
	return new Response('Hello from mock web handler!', { status: 200 });
};

const EffectHttpHandler = webHandlerToEffectHttpHandler(mockWebHandler);

const EffectHttpApiHandler = EffectHttpHandlerToHttpApi('*', EffectHttpHandler);

const _AstroAPIRoute = HttpApiToAstroRoute(EffectHttpApiHandler);
