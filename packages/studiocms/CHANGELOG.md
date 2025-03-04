# studiocms

## 0.1.0-beta.10

### Patch Changes

- [#445](https://github.com/withstudiocms/studiocms/pull/445) [`a3b0b6d`](https://github.com/withstudiocms/studiocms/commit/a3b0b6dab8dc59a1c2dad2251e3d95d22da62a37) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor `.d.ts` files to prevent weird type errors from popping up

- [#442](https://github.com/withstudiocms/studiocms/pull/442) [`8d9025d`](https://github.com/withstudiocms/studiocms/commit/8d9025dde99dd64fdae31a015357eff31027d481) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor integration index to prevent parts of the StudioCMS integration from being enabled during the first-time-setup stage.

- [#446](https://github.com/withstudiocms/studiocms/pull/446) [`610b759`](https://github.com/withstudiocms/studiocms/commit/610b759959b3fff33c541669b4c96a7e08d7ecaa) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement nanostore i18n client-side system to be used once i18n is ready

  This system is implemented in the dashboard but only the base locale ("en-us") is available at this time.

- [#447](https://github.com/withstudiocms/studiocms/pull/447) [`a9a2d43`](https://github.com/withstudiocms/studiocms/commit/a9a2d43f731c9ed32e9cdd0b2467b5b80ce8b693) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix: Create page form was sending the wrong type of data.

- [#443](https://github.com/withstudiocms/studiocms/pull/443) [`730b7d9`](https://github.com/withstudiocms/studiocms/commit/730b7d9a3a6818d20773b11e7e856e9a79884da2) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update declaration files to use dist directory instead of src

## 0.1.0-beta.9

### Patch Changes

- [#433](https://github.com/withstudiocms/studiocms/pull/433) [`8931327`](https://github.com/withstudiocms/studiocms/commit/89313277bac0f5e17929eb8d4e064d42fe9c5ce5) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #433)

- [#432](https://github.com/withstudiocms/studiocms/pull/432) [`4ac1dc2`](https://github.com/withstudiocms/studiocms/commit/4ac1dc295c56069cb126bd8c876fd98b31f9a8d8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Relocate static assets to CDN R2 bucket, Users can now delete the `studiocms-resources/` folder within their project `public/` folder.

- [#437](https://github.com/withstudiocms/studiocms/pull/437) [`e99f3d0`](https://github.com/withstudiocms/studiocms/commit/e99f3d0a1b089e24ca9a0c1f9d8f2ae1ba3d8b8e) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #437)

- [#441](https://github.com/withstudiocms/studiocms/pull/441) [`9dbe621`](https://github.com/withstudiocms/studiocms/commit/9dbe62125bd77ee674175dbb4fb64f5fa9ffc1ce) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix firsttime setup page redirect, and fix sdk

## 0.1.0-beta.8

### Patch Changes

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@column.text({](https://github.com/column.text({)! - Auth system overhaul:

  ## **`studiocms`**

  - Updated all Dependencies

  ## **`@studiocms/auth`**

  - Update `astro:env` schema:
    - `CMS_ENCRYPTION_KEY`: NEW - Required variable used for auth encryption, can be generated using `openssl rand --base64 16`.
    - `CMS_GITHUB_REDIRECT_URI`: NEW - Optional variable for GitHub Redirect URI if using multiple redirect URIs with Github oAuth.
  - Removed `Luicia` based auth system and `Lucia-astrodb-adapter`
  - Removed old `authHelper`
  - Add new OAuthButton components
    - `<OAuthButton />`
    - `<OAuthButtonStack />`
    - `oAuthButtonProviders.ts`
  - Add new `<AuthLayout />` component and CSS
  - Add new authentication library:
    - Auth library is built using the lucia-next resources and will now be maintained under `@studiocms/auth` as its own full module
    - Created Virtual module exports available during runtime
  - Add new login/signup backgrounds
  - Remove Middleware
  - Add `studiocms-logo.glb` for usage with New ThreeJS login/signup page
  - Update all Auth Routes
  - Update schema
  - Add new Scripts for ThreeJS
  - Update Stubs files and Utils
  - Refactor Integration to use new system.

  ## **`@studiocms/core`**

  - Disable interactivity for `<Avatar />` component. (Will always show a empty profile icon until we setup the new system for the front-end)
  - Update table schema:

    - `StudioCMSUsers`: Removed oAuth ID's from main user table

    ```diff
    export const StudioCMSUsers = defineTable({
        columns: {
            id: column.text({ primaryKey: true }),
            url: column.text({ optional: true }),
            name: column.text(),
            email: column.text({ unique: true, optional: true }),
            avatar: column.text({ optional: true }),
    -	    githubId: column.number({ unique: true, optional: true }),
    -	    githubURL: column.text({ optional: true }),
    -	    discordId: column.text({ unique: true, optional: true }),
    -	    googleId: column.text({ unique: true, optional: true }),
    -	    auth0Id: column.text({ unique: true, optional: true }),
            username: column.text(),
            password: column.text({ optional: true }),
            updatedAt: column.date({ default: NOW, optional: true }),
            createdAt: column.date({ default: NOW, optional: true }),
        },
    });
    ```

    - `StudioCMSOAuthAccounts`: New table to handle all oAuth accounts and linking to Users

    ```ts
    export const StudioCMSOAuthAccounts = defineTable({
      columns: {
        provider: column.text(), // github, google, discord, auth0
        providerUserId: column.text({ primaryKey: true }),
        userId: column.text({ references: () => StudioCMSUsers.columns.id }),
      },
    });
    ```

    - `StudioCMSPermissions`: Updated to use direct reference to users table

    ```ts
    export const StudioCMSPermissions = defineTable({
        columns: {
    references: () => StudioCMSUsers.columns.id }),
            rank: column.text(),
        },
    });
    ```

    - `StudioCMSSiteConfig`: Added new options for login page

    ```ts
    export const StudioCMSSiteConfig = defineTable({
      columns: {
        id: column.number({ primaryKey: true }),
        title: column.text(),
        description: column.text(),
        defaultOgImage: column.text({ optional: true }),
        siteIcon: column.text({ optional: true }),
        loginPageBackground: column.text({ default: "studiocms-curves" }),
        loginPageCustomImage: column.text({ optional: true }),
      },
    });
    ```

  - Updated Routemap:

    - All Auth api routes are now located at `yourhost.tld/studiocms_api/auth/*`

  - Updated Strings:

    - Add new Encryption messages for the new `CMS_ENCRYPTION_KEY` variable

  - Removed now unused auth types.

  ## **`@studiocms/dashboard`**

  - Refactor to utilize new `@studiocms/auth` lib for user verification

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Update First time setup routes and API endpoints

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Translation Updated (PR: #391)

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Expand PageData table schema and add Catagory and Tags schemas, and extend WP-importer

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Added Author and Contributor tracking

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Docs, Docs, and more Docs

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Implement new Dashboard design and update API endpoints

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Dynamic Sitemap integration

  ### Dynamic Sitemap Generation:

  - `packages/studiocms/src/index.ts`: Replaced the static sitemap integration with the new `dynamicSitemap` function to support multiple sitemaps from plugins.
  - `packages/studiocms/src/lib/dynamic-sitemap/index.ts`: Added the `dynamicSitemap` function to generate sitemaps dynamically based on the provided plugin configurations.
  - `packages/studiocms/src/lib/dynamic-sitemap/sitemap-index.xml.ts`: Created a new route to serve the sitemap index file, which lists all the individual sitemaps.

  ### Plugin Schema Updates:

  - `packages/studiocms/src/schemas/plugins/index.ts`: Updated the plugin schema to include an optional `sitemaps` field, allowing plugins to specify their own sitemap configurations.

  ### Plugin-Specific Sitemaps:

  - `packages/studiocms_blog/src/index.ts`: Updated the StudioCMS Blog plugin to include its own sitemaps for posts and markdown pages.
  - `packages/studiocms_blog/src/routes/sitemap-md.xml.ts`: Added a new route to generate the sitemap for markdown pages.
  - `packages/studiocms_blog/src/routes/sitemap-posts.xml.ts`: Added a new route to generate the sitemap for blog posts.

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Remove Astro ViewTransitions/ClientRouter

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - User invite and creation systems

  ### User Management Enhancements:

  - Added modals for creating new users and user invites in `InnerSidebarElement.astro` to streamline the user creation process.
  - Implemented new API routes `create-user` and `create-user-invite` to handle user creation and invite processes.
  - Updated `routeMap.ts` to include new endpoints for user creation and invites.

  ### UI Improvements:

  - Modified icons for 'Create Page' and 'Create Folder' options in `InnerSidebarElement.astro` to use standard document and folder icons.
  - Enhanced the user management dropdown by reordering properties for better readability.
  - Added custom styles for modal bodies to improve the user interface.

  ### Utility and SDK Updates:

  - Added new utility functions for generating random passwords and IDs in `generators.ts`, and updated references in `core.ts`.
  - Updated the SDK core to support rank assignment during user creation.

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Enhance StudioCMS Plugin system

  - Implement Dashboard pages
  - Add Optional API Routes and Fields for page types
  - Update Astro Web Vital plugin to add new dashboard page

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Implement Build step with esbuild and Update for Astro v5

- [#430](https://github.com/withstudiocms/studiocms/pull/430) [`36474b5`](https://github.com/withstudiocms/studiocms/commit/36474b592dd014635019d346f28688f8f5a60585) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update dependencies

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Add @studiocms/markdown-remark as a renderer option, and implement component proxy system to actually be used by this renderer

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Implement User quick action toolbar for frontend when user's are logged in

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Translation Updated (PR: #376)

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Implement Diff tracking system

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - New Renderer component

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Introduce Dashboard i18n logic

  - `studiocms` & `@studiocms/core`:

    - Introduce new virtual module `studiocms:i18n`:
      This module includes utilities for our new i18n system.
    - Add new LanguageSelector component
    - Add `en-us` translation file. (`packages/studiocms_core/i18n/translations/`)

  - `@studiocms/auth`:
    - Update login/signup routes to utilize new i18n translations
    - Transition routes to Hybrid type setup, All API routes will remain server rendered, while pages are now prerendered (Server islands when needed).

- [#312](https://github.com/withstudiocms/studiocms/pull/312) [`9c59d72`](https://github.com/withstudiocms/studiocms/commit/9c59d7230c86d8122c90c8b42c382a32a6d9820e) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - ♻️ Chore: We are now Turso Sponsored!

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Update Frontend logic and fix some small issues with rendering.

  - New Renderer Partial for rendering on-the-fly
  - Updated changelog endpoint to use new partial to fix rendering
  - Fixed TS Error in SDK
  - Fixed changelog rendering
  - Cleaned up Frontend package layout
  - Simplified Frontend route generation to use 1 file
  - Updated all exports.

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Introduce BASIC version of our plugin system.

  Currently Supports:

  - Custom Settings Page
    - Assign your fields
    - Bring your own API Endpoint function
  - Ability to add Frontend page links
  - Set the minimum StudioCMS Version
  - Bring your own Astro Integrations
  - Basic Page type identifier system
    - This system will eventually be expanded to allow custom Content types and access to passing custom content handling methods for custom implementations.

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Implement Component Proxy functionality

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Implement new StudioCMS SDK in @studiocms/core and integrate it into the new dashboard and frontend package

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Remove Unpic and simplify imageHandler

- [#301](https://github.com/withstudiocms/studiocms/pull/301) [`ebc297f`](https://github.com/withstudiocms/studiocms/commit/ebc297f2818deda6efca880a857f7e0929ad2378) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Update `.d.ts` file generation (non breaking)

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Merge StudioCMS packages into main package

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Implement new StudioCMS Auth lib

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Update URLs

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Small css tweak

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - New CLI, Updated integration logic and updated config processing.

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Add warning if no Adapter is present

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Fix CSS issue that caused sidebar to flow off the screen

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Adjusted strings to account for Astro Studio sunsetting

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Implement dashboard grid components system

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - StudioCMS is now headless, all routes have been moved to `@studiocms/blog` and that is now the recommended default plugin to install for users who want a basic headful setup

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - New REST API endpoints and Dashboard UI features

  New Routes:

  - `/studiocms_api/rest/v1/folders`
  - `/studiocms_api/rest/v1/folders/[id]`
  - `/studiocms_api/rest/v1/pages`
  - `/studiocms_api/rest/v1/pages/[id]`
  - `/studiocms_api/rest/v1/pages/[id]/history`
  - `/studiocms_api/rest/v1/pages/[id]/history/[id]`
  - `/studiocms_api/rest/v1/settings`
  - `/studiocms_api/rest/v1/users`
  - `/studiocms_api/rest/v1/users/[id]`

  All routes listed above are behind authentication.

  There is the following PUBLIC endpoints that ONLY support GET requests to published pages/folders

  - `/studiocms_api/rest/v1/public/pages`
  - `/studiocms_api/rest/v1/public/pages/[id]`
  - `/studiocms_api/rest/v1/public/folders`
  - `/studiocms_api/rest/v1/public/folders/[id]`

## 0.1.0-beta.7

### Patch Changes

- 880311a: Update URL from `astro-studiocms.xyz` to `studiocms.xyz`
- Updated dependencies [880311a]
- Updated dependencies [880311a]
  - @studiocms/dashboard@0.1.0-beta.7
  - @studiocms/frontend@0.1.0-beta.7
  - @studiocms/core@0.1.0-beta.7
  - @studiocms/betaresources@0.1.0-beta.7
  - @studiocms/imagehandler@0.1.0-beta.7
  - @studiocms/renderers@0.1.0-beta.7
  - @studiocms/robotstxt@0.1.0-beta.7
  - @studiocms/assets@0.1.0-beta.7
  - @studiocms/auth@0.1.0-beta.7
  - @studiocms/blog@0.1.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- 12bed03: Update dependencies
- ecb682a: Update readme, and package.json naming as well as references to Astro Studio to AstroDB.
- 585c5e4: Update readmes to reflect new package name
- ecb682a: [Update readme]: Update Astro Studio references to AstroDB as Studio is closing down.
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
- Updated dependencies [12bed03]
- Updated dependencies [1383e80]
- Updated dependencies [12bed03]
- Updated dependencies [12bed03]
- Updated dependencies [4f8e60b]
- Updated dependencies [12bed03]
  - @studiocms/dashboard@0.1.0-beta.6
  - @studiocms/renderers@0.1.0-beta.6
  - @studiocms/assets@0.1.0-beta.6
  - @studiocms/core@0.1.0-beta.6
  - @studiocms/auth@0.1.0-beta.6
  - @studiocms/frontend@0.1.0-beta.6
  - @studiocms/betaresources@0.1.0-beta.6
  - @studiocms/blog@0.1.0-beta.6
  - @studiocms/imagehandler@0.1.0-beta.6
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
- Updated dependencies [0bd2b31]
  - @studiocms/betaresources@0.1.0-beta.5
  - @studiocms/imagehandler@0.1.0-beta.5
  - @studiocms/dashboard@0.1.0-beta.5
  - @studiocms/renderers@0.1.0-beta.5
  - @studiocms/robotstxt@0.1.0-beta.5
  - @studiocms/frontend@0.1.0-beta.5
  - @studiocms/assets@0.1.0-beta.5
  - @studiocms/auth@0.1.0-beta.5
  - @studiocms/blog@0.1.0-beta.5
  - @studiocms/core@0.1.0-beta.5

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
