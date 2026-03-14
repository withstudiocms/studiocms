import { HttpApi, HttpApiBuilder, HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Effect, Layer, Schema } from 'effect';
import { AstroAPIContext } from '../../src/astro/context';
import { HttpApiToAstroRoute } from '../../src/astro/HttpApi';

// Example of defining an Effect API and converting it to an Astro API route handler
const api = HttpApi.make('myApi').add(
	HttpApiGroup.make('group').add(HttpApiEndpoint.get('get', '/').addSuccess(Schema.String))
);

// Build the Effect API Handler (with Astro context)
const groupLive = HttpApiBuilder.group(api, 'group', (handlers) =>
	handlers.handle('get', () =>
		Effect.gen(function* () {
			const { locals } = yield* AstroAPIContext;
			console.log('Astro Locals:', locals); // Log the locals to verify access
			return 'Hello from Effect API!';
		})
	)
);

// Create the Live Layer for the API
const MyApiLive = HttpApiBuilder.api(api).pipe(Layer.provide(groupLive));

// Convert the Effect API to an Astro API route handler
const _ALL = HttpApiToAstroRoute(MyApiLive);
//    ^ Type is (context: APIContext) => Promise<Response> (APIRoute)
