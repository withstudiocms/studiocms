import type * as HttpApi from '@effect/platform/HttpApi';
import { Api } from '@effect/platform/HttpApi';
import { Router } from '@effect/platform/HttpApiBuilder';
import * as HttpLayerRouter from '@effect/platform/HttpLayerRouter';
import * as HttpServerResponse from '@effect/platform/HttpServerResponse';
import * as OpenApi from '@effect/platform/OpenApi';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Html from './_internal/html.ts';
import * as internal from './_internal/httpApiScalar.js';

/**
 * Scalar theme identifiers.
 */
export type ScalarThemeId =
	| 'alternate'
	| 'default'
	| 'moon'
	| 'purple'
	| 'solarized'
	| 'bluePlanet'
	| 'saturn'
	| 'kepler'
	| 'mars'
	| 'deepSpace'
	| 'laserwave'
	| 'none';

/**
 * Configuration options for Scalar API documentation.
 *
 * @see https://github.com/scalar/scalar/blob/main/documentation/configuration.md
 */
export type ScalarConfig = {
	/** A string to use one of the color presets */
	theme?: ScalarThemeId;
	/** The layout to use for the references */
	layout?: 'modern' | 'classic';
	/** URL to a request proxy for the API client */
	proxyUrl?: string;
	/** Whether to show the sidebar */
	showSidebar?: boolean;
	/**
	 * Whether to show models in the sidebar, search, and content.
	 *
	 * Default: `false`
	 */
	hideModels?: boolean;
	/**
	 * Whether to show the “Test Request” button
	 *
	 * Default: `false`
	 */
	hideTestRequestButton?: boolean;
	/**
	 * Whether to show the sidebar search bar
	 *
	 * Default: `false`
	 */
	hideSearch?: boolean;
	/** Whether dark mode is on or off initially (light mode) */
	darkMode?: boolean;
	/** forceDarkModeState makes it always this state no matter what*/
	forceDarkModeState?: 'dark' | 'light';
	/** Whether to show the dark mode toggle */
	hideDarkModeToggle?: boolean;
	/**
	 * Path to a favicon image
	 *
	 * Default: `undefined`
	 * Example: '/favicon.svg'
	 */
	favicon?: string;
	/** Custom CSS to be added to the page */
	customCss?: string;
	/**
	 * The baseServerURL is used when the spec servers are relative paths and we are using SSR.
	 * On the client we can grab the window.location.origin but on the server we need
	 * to use this prop.
	 *
	 * Default: `undefined`
	 * Example: 'http://localhost:3000'
	 */
	baseServerURL?: string;
	/**
	 * We’re using Inter and JetBrains Mono as the default fonts. If you want to use your own fonts, set this to false.
	 *
	 * Default: `true`
	 */
	withDefaultFonts?: boolean;
	/**
	 * By default we only open the relevant tag based on the url, however if you want all the tags open by default then set this configuration option :)
	 *
	 * Default: `false`
	 */
	defaultOpenAllTags?: boolean;
};

/**
 * Generate the HTML component for Scalar API documentation.
 *
 * @param options - Configuration options for generating the HTML component.
 * @param options.api - The API specification to document.
 * @param options.spec - The OpenAPI specification to document.
 * @param options.scalar - Configuration options for Scalar.
 * @param options.starlight - Whether to wrap the component for Starlight compatibility.
 * @returns The HTML string for the Scalar API documentation component.
 *
 * @throws Will throw an error if neither `spec` nor `api` is provided.
 */
export const makeHtmlComponent = (options: {
	readonly api?: HttpApi.HttpApi.Any;
	readonly spec?: OpenApi.OpenAPISpec;
	readonly scalar?: ScalarConfig;
	readonly starlight?: boolean;
}) => {
	const { api, starlight = false } = options;
	let spec: OpenApi.OpenAPISpec;
	if (options.spec) {
		spec = options.spec;
	} else if (api) {
		// biome-ignore lint/suspicious/noExplicitAny: It's fine
		spec = OpenApi.fromApi(api as any);
	} else {
		throw new Error('Either spec or api must be provided to makeHtmlComponent');
	}

	const scalarConfig = {
		_integration: 'html',
		showToolbar: 'never',
		favicon: 'https://cdn.studiocms.dev/favicon.svg',
		hideClientButton: true,
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
		...options?.scalar,
	};

	const baseHtml = `<script id="api-reference" type="application/json">
      ${Html.escapeJson(spec)}
    </script>
    <script>
      document.getElementById('api-reference').dataset.configuration = JSON.stringify(${Html.escapeJson(scalarConfig)})
    </script>
    <script>${internal.javascript}</script>`;

	if (starlight) {
		return `<div class="not-content">${baseHtml}</div>`;
	}

	return baseHtml;
};

const makeHandler = (options: {
	readonly api: HttpApi.HttpApi.Any;
	readonly scalar?: ScalarConfig;
}) => {
	const { api, scalar } = options;
	// biome-ignore lint/suspicious/noExplicitAny: It's fine
	const spec = OpenApi.fromApi(api as any);

	const response = HttpServerResponse.html(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${Html.escape(spec.info.title)}</title>
    ${
			!spec.info.description
				? ''
				: `<meta name="description" content="${Html.escape(spec.info.description)}"/>`
		}
    ${
			!spec.info.description
				? ''
				: `<meta name="og:description" content="${Html.escape(spec.info.description)}"/>`
		}
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --scalar-custom-header-height: 50px;
      }
      .custom-header {
        height: var(--scalar-custom-header-height);
        background-color: var(--scalar-background-1);
        box-shadow: inset 0 -1px 0 var(--scalar-border-color);
        color: var(--scalar-color-1);
        font-size: var(--scalar-font-size-2);
        padding: 0 18px;
        position: sticky;
        justify-content: space-between;
        top: 0;
        z-index: 100;
      }
      .custom-header,
      .custom-header nav {
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .custom-header a:hover {
        color: var(--scalar-color-2);
      }
    </style>
  </head>
  <body>
    <header class="custom-header scalar-app">
      <b>StudioCMS API Specification</b>
      <nav>
        <a href="https://studiocms.dev" target="_blank" rel="noopener noreferrer">StudioCMS Website</a>
        <a href="https://chat.studiocms.dev" target="_blank" rel="noopener noreferrer">Discord</a>
      </nav>
    </header>
    ${makeHtmlComponent({ spec, scalar })}
  </body>
</html>`);

	return Effect.succeed(response);
};

/**
 * Create a Layer that serves the API documentation using Scalar.
 *
 * @param options - Configuration options for the Scalar documentation.
 * @param options.path - The path where the documentation will be served. Defaults to `/docs`.
 * @param options.scalar - Configuration options for Scalar.
 */
export const layer = (options?: {
	readonly path?: `/${string}` | undefined;
	readonly scalar?: ScalarConfig;
}): Layer.Layer<never, never, Api> =>
	Router.use(
		Effect.fnUntraced(function* (router) {
			const { api } = yield* Api;
			const handler = makeHandler({
				...options,
				api,
			});
			yield* router.get(options?.path ?? '/docs', handler);
		})
	);

/**
 * Create a Layer that serves the API documentation using Scalar
 * at the specified path using HttpLayerRouter.
 *
 * @param options - Configuration options for the Scalar documentation.
 * @param options.api - The API specification to document.
 * @param options.path - The path where the documentation will be served.
 * @param options.scalar - Configuration options for Scalar.
 */
export const layerHttpLayerRouter: (options: {
	readonly api: HttpApi.HttpApi.Any;
	readonly path: `/${string}`;
	readonly scalar?: ScalarConfig;
}) => Layer.Layer<never, never, HttpLayerRouter.HttpRouter> = Effect.fnUntraced(
	function* (options: {
		readonly api: HttpApi.HttpApi.Any;
		readonly path: `/${string}`;
		readonly scalar?: ScalarConfig;
	}) {
		const router = yield* HttpLayerRouter.HttpRouter;
		const handler = makeHandler(options);
		yield* router.add('GET', options.path, handler);
	},
	Layer.effectDiscard
);
