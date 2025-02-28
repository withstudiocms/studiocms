# @studiocms/blog

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
