import { createServer } from 'node:http';
import { HttpApiBuilder, HttpMiddleware, HttpServer } from '@effect/platform';
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import { Layer } from 'effect';
import { layer } from 'effectify/scalar';
import { StudioCMSAPISpec } from '../src/index.js';

// Create a route for the API documentation
const DocsRouteLive = layer({
	title: 'API Documentation',
	path: '/docs',
	sources: [
		{
			title: 'API Documentation',
			httpApi: StudioCMSAPISpec,
		},
	],
});

const MyApiLive = HttpApiBuilder.api(StudioCMSAPISpec);

// Configure and serve the API
const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
	// Add CORS middleware to handle cross-origin requests
	Layer.provide(HttpApiBuilder.middlewareCors()),
	// Provide the API implementation
	Layer.provide(DocsRouteLive),
	Layer.provide(MyApiLive),
	// Log the server's listening address
	HttpServer.withLogAddress,
	// Set up the Node.js HTTP server
	Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
);

// Launch the server
// Note there is a type error here, since we are only implementing docs, and not the full API, but it works fine for testing purposes
Layer.launch(HttpLive).pipe(NodeRuntime.runMain);
