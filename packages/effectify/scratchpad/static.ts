import { createServer } from 'node:http';
import {
	HttpApi,
	HttpApiBuilder,
	HttpApiEndpoint,
	HttpApiGroup,
	HttpMiddleware,
	HttpServer,
} from '@effect/platform';
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import { DateTime, Effect, Layer, Logger, LogLevel, Schema } from 'effect';
import { makeStaticFileHttpApiRouter } from '../src/static';

// Example of using the makeStaticFileHttpApiRouter to serve static files from a directory named 'static' in the current directory, with htmlIndex enabled to serve index.html for the root path
const TestStatic = makeStaticFileHttpApiRouter({
	htmlIndex: true,
})(import.meta.dirname, 'static');

// Example of defining an API with a single endpoint that returns a greeting message with the current time
const usersGroup = HttpApiGroup.make('hello').add(
	HttpApiEndpoint.get('world')`/test`.addSuccess(
		Schema.Struct({
			message: Schema.String,
		})
	)
);

// Create the API and add the group to it
const api = HttpApi.make('myApi').add(usersGroup);

// Example of defining a live implementation for the API group that returns a greeting message with the current time
const usersGroupLive = HttpApiBuilder.group(api, 'hello', (handlers) =>
	handlers.handle('world', () =>
		Effect.succeed({
			message: `Hello, world! The time is ${DateTime.unsafeNow().toLocaleString()}`,
		})
	)
);

// Create a live implementation for the API by providing the group implementation
const MyApiLive = HttpApiBuilder.api(api).pipe(Layer.provide(usersGroupLive));

// Configure and serve the API
const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
	// Provide the API implementation
	Layer.provide(MyApiLive),
	// Provide the static file serving router as middleware
	Layer.provide(TestStatic),
	// Log the server's listening address
	HttpServer.withLogAddress,
	// Set up the Node.js HTTP server
	Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
);

// Launch the server
Layer.launch(HttpLive).pipe(
	// Set the minimum log level to debug to see detailed logs about incoming requests and static file serving
	Logger.withMinimumLogLevel(LogLevel.Debug),
	// Run the server using the Node runtime
	NodeRuntime.runMain
);
