# effectify

A utility library that bridges Effect-ts with various utilities and projects, such as Astro!

## Features

- **Effect-ts Integration** - Convert Effect HTTP APIs to Astro API routes
- **Context Management** - Seamless Astro context integration with Effect contexts
- **Web Handler Conversion** - Built-in conversion utilities for Effect HTTP handlers
- **Scalar API Documentation** - Integrated API documentation generation

## Installation

```bash
pnpm add effectify
```

## Usage

> **Undocumented Modules**:
> - `effectify/scalar` - Custom version of the Scalar provided by Effect's HttpApi
> - `effectify/scrypt` - Node Scrypt Effect wrapper for password hashing

### `effectify/astro/*` Modules

Utilities specific for working with Effect and Astro

#### `effectify/astro/context`

This module provides an `AstroAPIContext` export that can be used when working with Effect HTTP web handlers within an Astro environment.

##### Example

The example below shows how to access Astro locals from within en HttpApi handler

```ts
import { AstroAPIContext } from 'effectify/astro/context';

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
```

#### `effectify/astro/HttApi`

This module provides a Utility to wrap your Effect-based HttpApi into a Astro `APIRoute`

##### Example

```ts
// src/pages/myApi.ts
import { HttpApiToAstroRoute } from 'effectify/astro/HttApi';

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
const ALL = HttpApiToAstroRoute(MyApiLive);
```

#### `effectify/astro/integration`

This module provides a `defineIntegration` utility for building Astro integrations with Effect-ts. The helper adds schema-validation for integration options and automatically wraps integration hooks to surface errors as `EffectifyIntegrationHookError` instances.

##### Features

- **Schema Validation** - Validate integration options using Effect Schema at initialization time
- **Automatic Error Handling** - All Effect-based hooks are wrapped to catch and re-throw errors with proper context
- **Type Safety** - Full TypeScript support with inferred types from schemas
- **Effect Integration** - Native Effect-ts patterns for hooks

##### Example

```ts
import { Effect, Schema } from 'effect';
import { defineIntegration, EffectifyIntegrationHookError } from 'effectify/astro/integration';

// Define an Astro integration with schema-validated options
export const myIntegration = defineIntegration({
	name: 'my-integration',
	schema: Schema.Struct({
		apiKey: Schema.String,
		enabled: Schema.optionalWith(Schema.Boolean, {
			default: () => true,
		}),
	}),
	setup: ({ name, options }) => ({
		'astro:config:setup': ({ logger }) =>
			Effect.gen(function* () {
				if (options.enabled) {
					logger.info(`${name} is enabled`);
				}
			}),
		'astro:config:done': ({ logger }) =>
			Effect.gen(function* () {
				logger.info(`Configuration complete for ${name}`);
			}),
	}),
});

// Use in astro.config.mjs
export default defineConfig({
	integrations: [
		myIntegration({
			apiKey: 'my-secret-key',
			enabled: true,
		}),
	],
});
```

##### Error Handling

The `defineIntegration` utility automatically wraps all hooks to catch errors. You can also explicitly handle errors within your hooks:

```ts
export const myIntegration = defineIntegration({
	name: 'my-integration',
	setup: ({ name, options }) => ({
		'astro:config:setup': ({ logger }) =>
			Effect.gen(function* () {
				// Your integration logic here
			}).pipe(
				Effect.catchAll((error) =>
					Effect.fail(
						new EffectifyIntegrationHookError({
							hook: 'astro:config:setup',
							message: 'Failed to setup integration',
							cause: error,
						})
					)
				)
			),
	}),
});
```

### `effectify/schemas`

#### `FunctionSchema` / `SyncFunctionSchema`

These functions provide the ability to define custom functions within Effect Schema for both async and sync functions.

##### Example (`FunctionSchema`)

Creates a schema for functions with validated inputs and outputs. Similar to Zod's `z.function()`.

The first param, is the args input, the second is the return. `FunctionSchema` will always return a async function. (promise-based)

```ts
import { FunctionSchema } from 'effectify/schemas';
import { Schema } from 'effect';

// Define your Schema
const LoginSchema = FunctionSchema(
	Schema.Struct({ username: Schema.String, password: Schema.String }),
	Schema.Boolean
);

// Example implementation function
const rawLoginFn = async (data: { username: string; password: string }) => {
	return data.username === 'admin' && data.password === '123';
};

// Create decoder
const decoder = Schema.decodeSync(LoginSchema)(rawLoginFn);

// Verify using implementation function internally
const result = await decoder({ username: 'admin', password: '123' });

console.log(result)
/* Console Output:
true
*/
```

##### Example (`SyncFunctionSchema`)

Similar to `FunctionSchema` but will always return a synchronous function.

```ts
import { SyncFunctionSchema } from 'effectify/schemas';
import { Schema } from 'effect';

// Define your Schema
const LoginSchema = SyncFunctionSchema(
	Schema.Struct({ username: Schema.String, password: Schema.String }),
	Schema.Boolean
);

// Example implementation function
const rawLoginFn = (data: { username: string; password: string }) => {
	return data.username === 'admin' && data.password === '123';
};

// Create decoder
const decoder = Schema.decodeSync(LoginSchema)(rawLoginFn);

// Verify using implementation function internally
const result = decoder({ username: 'admin', password: '123' });

console.log(result)
/* Console Output:
true
*/
```

### `effectify/static`

#### `makeStaticFileHttpApiRouter`

Creates an HTTP API router that serves static files from a specified directory. The router can be configured to serve an `index.html` file for the root path and to set appropriate caching headers for files with hashed filenames.

```ts
// /src/index.ts
import { makeStaticFileHttpApiRouter } from 'effectify/static';

const TestStatic = makeStaticFileHttpApiRouter({
	htmlIndex: true, // (optional) Allows for serving index.html
	pathPrefix: '/assets' // (optional) Allows setting custom base path for served assets (leave blank for base route)
})(import.meta.dirname, 'static'); // Directory would be /src/static/

// If the source directory was /src/index.ts and the assets was located at /assets/
// then you would use (import.meta.dirname, '..', 'assets')
```

#### `makeStaticFileMiddleware`

The router above is simply a wrapper around this middleware, and has the same settings.

```ts
import { makeStaticFileMiddleware } from 'effectify/static';

const StaticMiddleware = makeStaticFileMiddleware()(import.meta.dirname, 'static');
```

### `effectify/webHandler`

#### `webHandlerToEffectHttpHandler`

Converts a web handler function to an Effect HttpServerRequest handler.

```ts
import { webHandlerToEffectHttpHandler } from 'effectify/webHandler';

const mockWebHandler = async (request: Request) => {
	console.log('Received request:', request);
	return new Response('Hello from mock web handler!', { status: 200 });
};

const EffectHttpHandler = webHandlerToEffectHttpHandler(mockWebHandler);
```

#### `EffectHttpHandlerToHttpApi`

Utility function to convert a Effect-based web handler into a format that can be used with the HttpApiBuilder from Effect. This allows you to define your web handlers using Effect and then easily integrate them into an HTTP API.

```ts
// src/pages/[...api].ts
import { webHandlerToEffectHttpHandler, EffectHttpHandlerToHttpApi } from 'effectify/webHandler';

const mockWebHandler = async (request: Request) => {
	console.log('Received request:', request);
	return new Response('Hello from mock web handler!', { status: 200 });
};

const EffectHttpHandler = webHandlerToEffectHttpHandler(mockWebHandler);

const EffectHttpApiHandler = EffectHttpHandlerToHttpApi('*', EffectHttpHandler);

// Using a previous example to demonstrate possible usage
const ALL = HttpApiToAstroRoute(EffectHttpApiHandler);
```

## Contributing

Contributions are welcome! Please follow the StudioCMS contribution guidelines.

## License

[MIT License](./LICENSE)

## Links

- [StudioCMS Documentation](https://docs.studiocms.dev)
- [Effect-ts Documentation](https://effect.website)
- [Effect Platform Documentation](https://effect.website/docs/platform/introduction/)
- [Astro Documentation](https://docs.astro.build)
- [GitHub Repository](https://github.com/withstudiocms/studiocms)
