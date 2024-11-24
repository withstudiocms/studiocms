# @astrolicious/studiocms

## 0.1.0-beta.8

### Patch Changes

- [#301](https://github.com/withstudiocms/studiocms/pull/301) [`ebc297f`](https://github.com/withstudiocms/studiocms/commit/ebc297f2818deda6efca880a857f7e0929ad2378) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Update `.d.ts` file generation (non breaking)

- Updated dependencies []:
  - @studiocms/robotstxt@0.1.0-beta.8

## 0.1.0-beta.7

### Patch Changes

- 880311a: linted CSS files thanks to new version of BiomeJS (`v1.9.2`)
- 880311a: Update URL from `astro-studiocms.xyz` to `studiocms.xyz`
- Updated dependencies [880311a]
  - @studiocms/robotstxt@0.1.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- 12bed03: Update dependencies
- 12bed03: [Code Scanning Fix] Polynomial regular expression used on uncontrolled data

  - Replace function used for leading and trailing slashes (Non-Breaking)

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

  - @studiocms/robotstxt@0.1.0-beta.6

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

- 0bd2b31: [Breaking]: Update AstroDB Table Schemas to use prefixed table names (i.e. `Permissions` -> `StudioCMSPermissions` )

  This change will require migration to a new database or a full wipe of the current database.

  It is recommended to link to a new database and push the new schema changes and migrate your data from the old one.

- Updated dependencies [0bd2b31]
  - @studiocms/robotstxt@0.1.0-beta.5

## 0.1.0-beta.4

### Patch Changes

- f1f64a3: Implement extension system for Plugins to include new dashboard pages right in the sidebar
- b2ddf03: Refactor Authhelper (no end user changes needed)
- ceccec5: [Fix]: Ensure `@astrojs/web-vitals` integration is an optional addon and not required.
- 56ef990: # Breaking Changes

  - [Breaking]: Astro 4.14.5 is now the lowest supported version of StudioCMS
  - [Breaking]: AstroDB 0.13.2 is now the lowest supported version of StudioCMS

  # Non-Breaking Changes

  - [Update]: Utilize new InjectTypes from Astro instead of addDts from AIK (No user changes needed)
  - [Update]: `@matthiesenxyz/integration-utils` updated to newest version and fix usage (No user changes needed)
  - [Refactor]: Move web-vitals child components into their own folder (No user changes needed)
  - [Refactor]: Update [`isDashboardRoute.ts`](https://github.com/astrolicious/studiocms/blob/main/packages/studioCMS/src/integrations/studioCMSDashboard/routes/dashboard/components/isDashboardRoute.ts) to use `.include()` instead of direct comparison (No user changes needed)
  - [Refactor]: Move to namespacebuiltins vite plugin(Astro Integration) included from `@matthiesenxyz/integration-utils` instead of the internal copy (No user changes needed)
  - [Fix]: Remove now not needed exclude rules for `@matthiesenxyz/integration-utils` (No user changes needed)

## 0.1.0-beta.3

### Patch Changes

- 0949b48: New Mailing system for Beta Feedback form
- 5679b08: Fix: Allow studiocms-auth.config.json to be created during first time database setup
- 9a137b5: [Bug]: Fix case sensitivity issue in authHelper function

## 0.1.0-beta.2

### Patch Changes

- a2edb83: Validate secrets (or not) for `astro:env`
- d29bda7: Add check for unsafe usernames or passwords when creating local username/password accounts
- a016f48: - StudioCMS-Dashboard:

  Update UnoCSS to `0.61.5` and DaisyUI Preset to `0.1.1`

- a82114f: Lint project code
- c93ef7b: Sidebar signout for guest users

## 0.1.0-beta.1

### Minor Changes

- Initial beta release
