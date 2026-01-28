import { createServer } from 'node:http';
import { HttpApiScalar, HttpLayerRouter } from '@effect/platform';
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import { Layer } from 'effect';
import { StudioCMSAPISpec } from '../src/index.js';

// Create a route for the API documentation
const DocsRoute = HttpApiScalar.layerHttpLayerRouter({
	api: StudioCMSAPISpec,
	path: '/',
	scalar: {
		hideTestRequestButton: true,
		favicon: 'https://cdn.studiocms.dev/favicon.svg',
		// @ts-expect-error - For some reason they removed this property from the types but it's still supported
		hideClientButton: true,
		showToolbar: 'never',
		hiddenClients: {
			// C
			c: ['libcurl'],
			// Clojure
			clojure: ['clj_http'],
			// C#
			csharp: ['httpclient', 'restsharp'],
			// Dart
			dart: ['http'],
			// F#
			fsharp: ['httpclient'],
			// Go
			go: ['native'],
			// HTTP
			http: ['http1.1'],
			// Java
			java: ['asynchttp', 'nethttp', 'okhttp', 'unirest'],
			// JavaScript
			js: ['axios', 'jquery', 'ofetch', 'xhr'],
			// Kotlin
			kotlin: ['okhttp'],
			// Node.js
			node: ['axios', 'ofetch', 'undici'],
			// Objective-C
			objc: ['nsurlsession'],
			// OCaml
			ocaml: ['cohttp'],
			// PHP
			php: ['curl', 'guzzle'],
			// PowerShell
			powershell: ['restmethod', 'webrequest'],
			// Python
			python: ['httpx_async', 'httpx_sync', 'python3', 'requests'],
			// R
			r: ['httr'],
			// Ruby
			ruby: ['native'],
			// Rust
			rust: ['reqwest'],
			// Shell
			shell: ['httpie', 'wget'],
			// Swift
			swift: ['nsurlsession'],
		},
	},
});

// Serve the API documentation using NodeHttpServer on port 3000
HttpLayerRouter.serve(DocsRoute).pipe(
	Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
	Layer.launch,
	NodeRuntime.runMain
);
