# @studiocms/blog

## 0.1.0-beta.14

### Patch Changes

- Updated dependencies [[`ae5176d`](https://github.com/withstudiocms/studiocms/commit/ae5176dd683c0abc5b997c2e5f5935df5eb7d33e), [`1e61e13`](https://github.com/withstudiocms/studiocms/commit/1e61e13c2d7d02a4d00f733a268884904a644e37), [`4d42b42`](https://github.com/withstudiocms/studiocms/commit/4d42b4289ce43f2812fbb80913485db8a300163e), [`55663b2`](https://github.com/withstudiocms/studiocms/commit/55663b243fd516ed77a90987b9768f82184c180b), [`b26cfb5`](https://github.com/withstudiocms/studiocms/commit/b26cfb58f19c1b571a1395a6bc6c6d3963e0a19a), [`f45607e`](https://github.com/withstudiocms/studiocms/commit/f45607e2efc61242db96d5cc9a408e9af27d7650), [`7d14e58`](https://github.com/withstudiocms/studiocms/commit/7d14e583406c2afcbd398d4c7da2187ba79a840c), [`62ee6fc`](https://github.com/withstudiocms/studiocms/commit/62ee6fc4a3afc7a57470e3a72d8ec61785d39a18), [`055824c`](https://github.com/withstudiocms/studiocms/commit/055824c6a5a52b74ed169050745328bdac07e6bb)]:
  - studiocms@0.1.0-beta.14

## 0.1.0-beta.13

### Patch Changes

- [#478](https://github.com/withstudiocms/studiocms/pull/478) [`df24828`](https://github.com/withstudiocms/studiocms/commit/df2482847269c1b0d1ab7c6443deff243601fc08) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor rendering system to rely on plugin PageTypes instead of the old built-in system, this will allow new page types to easily bring their own renderer that can get called from the main renderer component.

  #### Breaking Changes

  - Removed MDX, and MarkDoc from built-in renderer. These will be replaced by plugins.
  - Rendering system is now directly tied into the plugin PageTypes defined within plugins. Instead of passing just the content to the renderer, you now must pass the entire PageData from the SDK.
  - New Rendering Component is now able to auto adapt to the pageType's provided renderer. (This means you can use the provided `<StudioCMSRenderer />` component to render any pageType that has been configured for StudioCMS through plugins. or use the data directly and render it yourself.)

  **OLD Method** (`[...slug].astro`)

  ```astro title="[...slug].astro"
  ---
  import { StudioCMSRenderer } from 'studiocms:renderer';
  import studioCMS_SDK from 'studiocms:sdk';
  import Layout from '../layouts/Layout.astro';

  let { slug } = Astro.params;

  if (!slug) {
  	slug = 'index';
  }

  const page = await studioCMS_SDK.GET.databaseEntry.pages.bySlug(slug);

  if (!page) {
  	return new Response(null, { status: 404 });
  }

  const { title, description, heroImage, defaultContent } = page;

  const content = defaultContent.content || '';
  ---

  <Layout title={title} description={description} heroImage={heroImage}>
  	<main>
  		<StudioCMSRenderer content={content} />
  	</main>
  </Layout>
  ```

  **New Method** (`[...slug].astro`)

  ```astro title="[...slug].astro"
  ---
  import { StudioCMSRenderer } from 'studiocms:renderer';
  import studioCMS_SDK from 'studiocms:sdk';
  import Layout from '../layouts/Layout.astro';

  let { slug } = Astro.params;

  if (!slug) {
  	slug = 'index';
  }

  const page = await studioCMS_SDK.GET.databaseEntry.pages.bySlug(slug);

  if (!page) {
  	return new Response(null, { status: 404 });
  }

  const { title, description, heroImage } = page;
  ---

  <Layout title={title} description={description} heroImage={heroImage}>
  	<main>
  		<StudioCMSRenderer data={page} />
  	</main>
  </Layout>
  ```

- [#473](https://github.com/withstudiocms/studiocms/pull/473) [`ddc7eb8`](https://github.com/withstudiocms/studiocms/commit/ddc7eb8a9a351d851bb5820dcb2297dc4de793d9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update READMEs

- Updated dependencies [[`48630ef`](https://github.com/withstudiocms/studiocms/commit/48630ef21bac514baa23aeb07d4fbf6fd09fb909), [`3612916`](https://github.com/withstudiocms/studiocms/commit/3612916cf393488e4ba850312cc0a8ce27fd9122), [`77f89d6`](https://github.com/withstudiocms/studiocms/commit/77f89d6ecec0f06ffdb03bb8b86e99880345ee48), [`5780894`](https://github.com/withstudiocms/studiocms/commit/578089449210d017748df5fd27b34569a6899ce0), [`a430661`](https://github.com/withstudiocms/studiocms/commit/a4306618aeb3479f9d7b074637a54dc65798fe78), [`4fc5d6b`](https://github.com/withstudiocms/studiocms/commit/4fc5d6b9528968d7681dbf2f549e844989e10eb5), [`3f8b220`](https://github.com/withstudiocms/studiocms/commit/3f8b220a118b7829d9680b579fc50dd379d25c4b), [`501d11c`](https://github.com/withstudiocms/studiocms/commit/501d11cb41dd89e0280eecba9db57a49fce260a5), [`ab1714c`](https://github.com/withstudiocms/studiocms/commit/ab1714ce7d89560c545b42601c888a004941f992), [`0901215`](https://github.com/withstudiocms/studiocms/commit/0901215cf33b7e0283c1b31265038fd15efd7dfb), [`df24828`](https://github.com/withstudiocms/studiocms/commit/df2482847269c1b0d1ab7c6443deff243601fc08), [`dae7795`](https://github.com/withstudiocms/studiocms/commit/dae77957cac866e47d09997ac6c990e3326459ea), [`ddc7eb8`](https://github.com/withstudiocms/studiocms/commit/ddc7eb8a9a351d851bb5820dcb2297dc4de793d9), [`4880ce8`](https://github.com/withstudiocms/studiocms/commit/4880ce877a0c4bea3dcbe1c1565a78ab56603afc), [`9512aac`](https://github.com/withstudiocms/studiocms/commit/9512aac4a928423caf91cbaa1c89a29e9d40a731), [`ddee17d`](https://github.com/withstudiocms/studiocms/commit/ddee17de1be97d05345caa4008de95c36e30333d), [`ddc7eb8`](https://github.com/withstudiocms/studiocms/commit/ddc7eb8a9a351d851bb5820dcb2297dc4de793d9)]:
  - studiocms@0.1.0-beta.13

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
