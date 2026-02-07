import { createServer } from 'node:http';
import { HttpLayerRouter } from '@effect/platform';
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import { Layer } from 'effect';
import { StudioCMSAPISpec } from '../src/index.js';
import * as HttpApiScalar from '../src/scalar.js';

// Create a route for the API documentation
const DocsRoute = HttpApiScalar.layerHttpLayerRouter({
	api: StudioCMSAPISpec,
	path: '/',
	scalar: {
		hideTestRequestButton: true,
	},
});

// Serve the API documentation using NodeHttpServer on port 3000
HttpLayerRouter.serve(DocsRoute).pipe(
	Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
	Layer.launch,
	NodeRuntime.runMain
);
