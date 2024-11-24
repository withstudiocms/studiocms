# @studiocms/renderers

## 0.1.0-beta.8

### Patch Changes

- [#301](https://github.com/withstudiocms/studiocms/pull/301) [`ebc297f`](https://github.com/withstudiocms/studiocms/commit/ebc297f2818deda6efca880a857f7e0929ad2378) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Update `.d.ts` file generation (non breaking)

- Updated dependencies [[`ebc297f`](https://github.com/withstudiocms/studiocms/commit/ebc297f2818deda6efca880a857f7e0929ad2378)]:
  - @studiocms/core@0.1.0-beta.8

## 0.1.0-beta.7

### Patch Changes

- 880311a: Update URL from `astro-studiocms.xyz` to `studiocms.xyz`
- Updated dependencies [880311a]
- Updated dependencies [880311a]
  - @studiocms/core@0.1.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- 12bed03: Update dependencies
- 12bed03: [MarkDoc] Update MarkDoc support

  - Add advanced config options for MarkDoc

  ```ts
  studioCMS({
      rendererConfig: {
          markdocConfig: {
              /**
               * The MarkDoc Content Renderer to use for rendering pages and posts
               *
               * Can be one of the following: `html`, `react-static`, or a custom renderer
               */
              renderType: 'html',
              /**
               * The MarkDoc Arg Parse to use for rendering pages and posts
               */
              argsParse: {
                  file: 'string',
                  slots: false,
                  location: false,
              },
              /**
               * The MarkDoc Transform Config to use for rendering pages and posts
               *
               * @see https://markdoc.dev/docs/config
               */
              transformConfig: {
                  nodes: {},
                  tags: {},
                  variables: {},
                  functions: {},
                  partials: {},
                  validation: {};
              },
          }
      }
  })
  ```

  - Add support for MarkDoc `renderType` of `html`, and `react-static`, and custom renderers such as the provided `markdocReactRenderer` from `@studiocms/renderers/exports/markdoc/react`:

  ```ts
  import { defineConfig } from 'astro/config';
  import react from '@astrojs/react';
  import studioCMS from 'studiocms';
  import markDocRenderReact from '@studiocms/renderers/exports/markdoc/react';

  // https://astro.build/config
  export default defineConfig({
  	//...Rest of Config
  	integrations: [
          //...Rest of Config
  		react(),
  		studioCMS({
              //...Rest of Config
              rendererConfig: {
                  markdocConfig: {
                      renderType: markDocRenderReact(components: {}), // Also applies to users with a `studiocms.config.mjs` file.
                  }
              }
          }),
  	],
  });
  ```

- 1383e80: [Update] Add MDX Renderer:

  - Add mdxConfig schema and renderer option for new MDX renderer
  - Add renderer to StudioCMSRenderer

- 12bed03: [Refactor]: Update virtual module generation

  - Move `virtual:studiocms/astromdremarkConfig` and rename to `studiocms:renderer/astroMarkdownConfig` from the `@studiocms/core` to `@studiocms/renderers`
  - New virtual module for the rendererConfig `studiocms:renderer/config`

- 12bed03: [Refactor]: Update main config schema for renderers.

  - Removed `contentRenderer` and `markedConfig` from the main options
  - Added config for MarkDoc
  - Created new `rendererConfig` section:

  ```ts
  // astro.config.mjs
  // https://astro.build/config
  export default defineConfig({
    // ...Rest of Astro Config
    integrations: [
      studiocms({
        // ...Rest of StudioCMS Config
        // (This is the same if you use the 'studiocms.config.mjs' file)
        rendererConfig: {
          renderer: "marked", // Can also be 'astro', or 'markdoc'
          markedConfig: {
            /* MarkedJS Config */
          },
          markdocConfig: {
            /* MarkDoc Config */
          },
        },
      }),
    ],
  });
  ```

- 12bed03: [Migrate/Deprecation]: customRendererPlugin moved to StudioCMSRendererConfig

  - Deprecation of StudioCMSPluginOptions defined CustomRenderers
  - Add new option to define renderers from StudioCMSOptions config:

  ```ts
  // astro.config.mjs
  function simpleHTMLRenderer(content: string) {
    return {
      name: "simple-html-renderer",
      renderer: async (content: string) => {
        return `<p>${content}</p>`;
      },
    };
  }

  // https://astro.build/config
  export default defineConfig({
    // ...Rest of Astro Config
    integrations: [
      studiocms({
        // ...Rest of StudioCMS Config
        // (This is the same if you use the 'studiocms.config.mjs' file)
        rendererConfig: {
          renderer: simpleHTMLRenderer,
        },
      }),
    ],
  });
  ```

- Updated dependencies [12bed03]
- Updated dependencies [12bed03]
- Updated dependencies [1383e80]
- Updated dependencies [12bed03]
- Updated dependencies [12bed03]
- Updated dependencies [12bed03]
  - @studiocms/core@0.1.0-beta.6

## 0.1.0-beta.5

### Patch Changes

- 0bd2b31: [Refactor/Rename]: Split main package into smaller packages and rename main package.

  This change will allow a better divide between the StudioCMS ecosystem packages. The main Astro Integration is now named `studiocms`.

  Renamed Packages:

  - `studiocms`: The main package that users will download and use.
  - `@studiocms/blog`: The StudioCMSBlog Plugin

  New Packages and their purposes:

  - `@studiocms/core`: Core components and functions
  - `@studiocms/assets`: Assets used for the StudioCMS Dashboard and other integrations
  - `@studiocms/renderers`: StudioCMS renderer system
  - `@studiocms/imagehandler`: StudioCMS image service and components
  - `@studiocms/auth`: StudioCMS auth routes and middleware
  - `@studiocms/frontend`: Userfacing pages and routes
  - `@studiocms/dashboard`: The main dashboard components, routes, and API endpoints
  - `@studiocms/robotstxt`: Generation of robots.txt file
  - `@studiocms/betaresources`: Resources for the beta.

- Updated dependencies [0bd2b31]
- Updated dependencies [0bd2b31]
  - @studiocms/core@0.1.0-beta.5
