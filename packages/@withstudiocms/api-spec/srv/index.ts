import { createServer } from 'node:http';
import { HttpApiScalar, HttpLayerRouter } from '@effect/platform';
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import { Layer } from 'effect';
import { StudioCMSAPISpec } from '../src/index.js';

// Create a /docs route for the API documentation
const DocsRoute = HttpApiScalar.layerHttpLayerRouter({
	api: StudioCMSAPISpec,
	path: '/',
	scalar: {
		hideTestRequestButton: true,
		// TODO: Remove the ts-expect-error when @effect/platform is updated
		// @ts-expect-error - Need to wait for an update to @effect/platform to fix this type
		hideDownloadButton: true,
	},
});

HttpLayerRouter.serve(DocsRoute).pipe(
	Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
	Layer.launch,
	NodeRuntime.runMain
);
