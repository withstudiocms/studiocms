import type * as HttpApi from '@effect/platform/HttpApi';
import { Router } from '@effect/platform/HttpApiBuilder';
import * as HttpServerResponse from '@effect/platform/HttpServerResponse';
import * as OpenApi from '@effect/platform/OpenApi';
import type { Layer } from 'effect';
import * as Effect from 'effect/Effect';
import * as Html from './_internal/html.ts';
import * as internal from './_internal/httpApiScalar.ts';

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

type SourceBase = {
	title: string;
	slug?: string | undefined;
	default?: boolean | undefined;
	customCss?: string | undefined;
};

type InlineSource = SourceBase & {
	content: string;
};

type ExternalSource = SourceBase & {
	url: string;
};

type HttpApiSpec = SourceBase & {
	httpApi: HttpApi.HttpApi.Any;
};

type Source = InlineSource | ExternalSource | HttpApiSpec;

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
	readonly sources: Source[];
	readonly scalar?: ScalarConfig | undefined;
	readonly starlight?: boolean;
}): string => {
	const { sources: rawSources, starlight = false } = options;

	const sources = rawSources.map((source) => {
		if ('content' in source) {
			return source;
		}
		if ('url' in source) {
			return source;
		}
		if ('httpApi' in source) {
			// biome-ignore lint/suspicious/noExplicitAny: This is fine
			const spec = OpenApi.fromApi(source.httpApi as any);
			return {
				...source,
				content: JSON.stringify(spec),
			};
		}
		throw new Error('Invalid source provided to Scalar documentation');
	});

	const scalarConfig = {
		_integration: 'html',
		showToolbar: 'never',
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
		sources,
		...options?.scalar,
	};

	const baseHtml = `<div id="app"></div>
    <script>${internal.javascript}</script>
    <script>Scalar.createApiReference('#app', ${Html.escapeJson(scalarConfig)})</script>`;

	if (starlight) {
		return `<div class="not-content">${baseHtml}</div>`;
	}

	return baseHtml;
};

/**
 * Props for the custom header component in Scalar documentation.
 */
export type CustomHeaderProps = {
	title?: {
		link: string;
		text: string;
		img?: string | undefined;
	};
	nav?: {
		link: string;
		text: string;
	}[];
};

/**
 * Creates an HTTP handler for serving Scalar API documentation, with optional custom header and theming.
 *
 * @param options - Configuration options for the Scalar documentation handler.
 * @returns An Effect that produces an HttpServerResponse containing the Scalar documentation page.
 */
const makeHandler = (options: {
	readonly title: string;
	readonly description?: string | undefined;
	readonly customHeader?: CustomHeaderProps | undefined;
	readonly sources: Source[];
	readonly scalar?: ScalarConfig;
}) => {
	const { sources, scalar, title, description } = options;

	const response = HttpServerResponse.html(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${Html.escape(title)}</title>
    ${!description ? '' : `<meta name="description" content="${Html.escape(description)}"/>`}
    ${!description ? '' : `<meta name="og:description" content="${Html.escape(description)}"/>`}
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg">
	<link rel="icon" href="/favicon.ico">
    ${
			options.customHeader
				? `<style>
      :root {
        --scalar-custom-header-height: 50px;
      }
	  body {
	    background-color: var(--scalar-background-1, #000);
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

	  .custom-header a {
		display: flex;
		align-items: center;
		gap: 6px;
	  }

	  .custom-header svg {
		display: block;
		height: 32px;
		width: 32px;
	  }
	
	  .custom-header i {
		font-style: italic;
	  }
    </style>`
				: ''
		}
  </head>
  <body>
    ${
			!options.customHeader
				? ''
				: `
    <header class="custom-header scalar-app">
      ${
				!options.customHeader.title
					? ''
					: `<a href="${Html.escape(options.customHeader.title.link)}" style="text-decoration: none; color: inherit;">
          ${!options.customHeader.title.img ? '' : `<img src="${Html.escape(options.customHeader.title.img)}" alt="${Html.escape(options.customHeader.title.text)} Logo" height="32" />`}
          <span>${Html.escape(options.customHeader.title.text)}</span>
        </a>`
			}
      ${
				!options.customHeader.nav
					? ''
					: `<nav>
          ${options.customHeader.nav.map((link) => `<a href="${Html.escape(link.link)}" target="_blank" rel="noopener noreferrer">${Html.escape(link.text)}</a>`).join('')}
        </nav>`
			}
    </header>
    `
		}
    ${makeHtmlComponent({ scalar, sources })}
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
export const layer = (options: {
	readonly title: string;
	readonly description?: string | undefined;
	readonly sources: Source[];
	readonly customHeader?: CustomHeaderProps | undefined;
	readonly path?: `/${string}` | undefined;
	readonly scalar?: ScalarConfig;
}): Layer.Layer<never, never, never> =>
	Router.use(
		Effect.fnUntraced(function* (router) {
			const handler = makeHandler(options);
			yield* router.get(options?.path ?? '/docs', handler);
		})
	);
