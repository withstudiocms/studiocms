# @studiocms/blog

## 0.1.0-beta.12

### Patch Changes

- [#454](https://github.com/withstudiocms/studiocms/pull/454) [`1021093`](https://github.com/withstudiocms/studiocms/commit/1021093c253085dbe9dadf6a37913dc57654409e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update minimum studiocms version to `beta.8`

- Updated dependencies [[`66ca9c7`](https://github.com/withstudiocms/studiocms/commit/66ca9c7a5209edf2eb8e4a6336cb0db24936179e), [`d66d081`](https://github.com/withstudiocms/studiocms/commit/d66d081748399e30d3940b6d1447f576d2e14c1c), [`a23a95e`](https://github.com/withstudiocms/studiocms/commit/a23a95e5bf8209d456fc02468622840aa2167d40), [`1021093`](https://github.com/withstudiocms/studiocms/commit/1021093c253085dbe9dadf6a37913dc57654409e), [`d445247`](https://github.com/withstudiocms/studiocms/commit/d4452478a83e59218f228c2d30a58447295841c4), [`49171af`](https://github.com/withstudiocms/studiocms/commit/49171af77f341b458cbb5155f656d9e7e1061a05), [`feb37bf`](https://github.com/withstudiocms/studiocms/commit/feb37bf059aea1280eb466b4a1ff3807ce4518f8), [`c77c4c7`](https://github.com/withstudiocms/studiocms/commit/c77c4c712982c3debdf0c34a2a635fb22c2d85d7), [`c914ec4`](https://github.com/withstudiocms/studiocms/commit/c914ec4e10f7b33503f958d5c06fba8f1bd9fd1d), [`0b4c1fe`](https://github.com/withstudiocms/studiocms/commit/0b4c1fef2f69c2b593a3c82d7eb4036aabb4efd9), [`1421e4c`](https://github.com/withstudiocms/studiocms/commit/1421e4c79907ddf1cb2d7360f2f87e81aabb719f), [`bf1b118`](https://github.com/withstudiocms/studiocms/commit/bf1b118852da3cd40293b71e96780f25d915c710)]:
  - studiocms@0.1.0-beta.12

## 0.1.0-beta.11

### Patch Changes

- Updated dependencies [[`bceda0a`](https://github.com/withstudiocms/studiocms/commit/bceda0a52fc51ea98914864e75201a147cb0ae46)]:
  - studiocms@0.1.0-beta.11

## 0.1.0-beta.10

### Patch Changes

- Updated dependencies [[`a3b0b6d`](https://github.com/withstudiocms/studiocms/commit/a3b0b6dab8dc59a1c2dad2251e3d95d22da62a37), [`8d9025d`](https://github.com/withstudiocms/studiocms/commit/8d9025dde99dd64fdae31a015357eff31027d481), [`610b759`](https://github.com/withstudiocms/studiocms/commit/610b759959b3fff33c541669b4c96a7e08d7ecaa), [`a9a2d43`](https://github.com/withstudiocms/studiocms/commit/a9a2d43f731c9ed32e9cdd0b2467b5b80ce8b693), [`730b7d9`](https://github.com/withstudiocms/studiocms/commit/730b7d9a3a6818d20773b11e7e856e9a79884da2)]:
  - studiocms@0.1.0-beta.10

## 0.1.0-beta.9

### Patch Changes

- Updated dependencies [[`8931327`](https://github.com/withstudiocms/studiocms/commit/89313277bac0f5e17929eb8d4e064d42fe9c5ce5), [`4ac1dc2`](https://github.com/withstudiocms/studiocms/commit/4ac1dc295c56069cb126bd8c876fd98b31f9a8d8), [`e99f3d0`](https://github.com/withstudiocms/studiocms/commit/e99f3d0a1b089e24ca9a0c1f9d8f2ae1ba3d8b8e), [`9dbe621`](https://github.com/withstudiocms/studiocms/commit/9dbe62125bd77ee674175dbb4fb64f5fa9ffc1ce)]:
  - studiocms@0.1.0-beta.9

## 0.1.0-beta.8

### Patch Changes

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Docs, Docs, and more Docs

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

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Update to conform to new StudioCMS plugin system

- [#430](https://github.com/withstudiocms/studiocms/pull/430) [`36474b5`](https://github.com/withstudiocms/studiocms/commit/36474b592dd014635019d346f28688f8f5a60585) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update dependencies

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Update URLs

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - StudioCMS is now headless, all routes have been moved to `@studiocms/blog` and that is now the recommended default plugin to install for users who want a basic headful setup

- Updated dependencies [[`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`36474b5`](https://github.com/withstudiocms/studiocms/commit/36474b592dd014635019d346f28688f8f5a60585), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`9c59d72`](https://github.com/withstudiocms/studiocms/commit/9c59d7230c86d8122c90c8b42c382a32a6d9820e), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`ebc297f`](https://github.com/withstudiocms/studiocms/commit/ebc297f2818deda6efca880a857f7e0929ad2378), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c), [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c)]:
  - studiocms@0.1.0-beta.8

## 0.1.0-beta.7

### Patch Changes

- 880311a: Update URL from `astro-studiocms.xyz` to `studiocms.xyz`
- Updated dependencies [880311a]
- Updated dependencies [880311a]
  - @studiocms/frontend@0.1.0-beta.7
  - @studiocms/core@0.1.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- Updated dependencies [12bed03]
- Updated dependencies [12bed03]
- Updated dependencies [1383e80]
- Updated dependencies [12bed03]
- Updated dependencies [12bed03]
- Updated dependencies [12bed03]
  - @studiocms/core@0.1.0-beta.6
  - @studiocms/frontend@0.1.0-beta.6

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
  - @studiocms/frontend@0.1.0-beta.5
  - @studiocms/core@0.1.0-beta.5

## 0.1.0-beta.4

### Patch Changes

- Updated dependencies [f1f64a3]
- Updated dependencies [b2ddf03]
- Updated dependencies [ceccec5]
- Updated dependencies [56ef990]
  - @astrolicious/studiocms@0.1.0-beta.4

## 0.1.0-beta.3

### Patch Changes

- Updated dependencies [0949b48]
- Updated dependencies [5679b08]
- Updated dependencies [9a137b5]
  - @astrolicious/studiocms@0.1.0-beta.3

## 0.1.0-beta.2

### Patch Changes

- a82114f: Lint project code
- Updated dependencies [a2edb83]
- Updated dependencies [d29bda7]
- Updated dependencies [a016f48]
- Updated dependencies [a82114f]
- Updated dependencies [c93ef7b]
  - @astrolicious/studiocms@0.1.0-beta.2

## 0.1.0-beta.1

### Minor Changes

- Initial beta release

### Patch Changes

- Updated dependencies
  - @astrolicious/studiocms@0.1.0-beta.1
