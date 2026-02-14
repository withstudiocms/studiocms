import { createServer } from 'node:http';
import { HttpApiBuilder, HttpMiddleware, HttpServer } from '@effect/platform';
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import { Layer } from 'effect';
import { layer } from 'effectify/scalar';
import {
	StudioCMSAuthApi,
	StudioCMSDashboardApiSpec,
	StudioCMSIntegrationsApiSpec,
	StudioCMSRestApiV1Spec,
	StudioCMSSDKApiSpec,
} from '../src/index.js';

// Create a route for the API documentation
const DocsRouteLive = layer({
	title: 'StudioCMS API Documentation',
	customHeader: {
		title: {
			text: 'StudioCMS API Documentation',
			link: '/docs',
		},
		nav: [],
	},
	description:
		'The Documentation for the StudioCMS API, including all available endpoints and specifications.',
	path: '/docs',
	sources: [
		{
			title: 'Auth API',
			httpApi: StudioCMSAuthApi,
		},
		{
			title: 'Dashboard API',
			httpApi: StudioCMSDashboardApiSpec,
		},
		{
			title: 'Integrations API',
			httpApi: StudioCMSIntegrationsApiSpec,
		},
		{
			title: 'REST API v1',
			httpApi: StudioCMSRestApiV1Spec,
		},
		{
			title: 'SDK API',
			httpApi: StudioCMSSDKApiSpec,
		},
	],
});

const APIStack = StudioCMSDashboardApiSpec.addHttpApi(StudioCMSAuthApi)
	.addHttpApi(StudioCMSIntegrationsApiSpec)
	.addHttpApi(StudioCMSRestApiV1Spec)
	.addHttpApi(StudioCMSSDKApiSpec);

const MyApiLive = HttpApiBuilder.api(APIStack);

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
