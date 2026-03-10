# @withstudiocms/api-spec

## 0.3.0

### Minor Changes

- [#1421](https://github.com/withstudiocms/studiocms/pull/1421) [`d7a0217`](https://github.com/withstudiocms/studiocms/commit/d7a0217e5ece55eddfa34399075614bef2041052) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Removes deprecated and unused SDK listpages endpoint, and updates the changelog json endpoint to not use .json in the pathname

- [#1440](https://github.com/withstudiocms/studiocms/pull/1440) [`9eec9c3`](https://github.com/withstudiocms/studiocms/commit/9eec9c3b45523b635cfe16d55aa55afabacbebe3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduces new admin level api token revocation endpoint

- [#1438](https://github.com/withstudiocms/studiocms/pull/1438) [`f4a209f`](https://github.com/withstudiocms/studiocms/commit/f4a209fc090c90195e2419fff47b48a46eab7441) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactors and cleans up API spec handlers to remove un-needed variables and tighten security

- [#1299](https://github.com/withstudiocms/studiocms/pull/1299) [`d0ef542`](https://github.com/withstudiocms/studiocms/commit/d0ef542490b45bc65e276c30ae422b3386ed9f88) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Adds new effectify package to dependency list

- [#1305](https://github.com/withstudiocms/studiocms/pull/1305) [`0cafedf`](https://github.com/withstudiocms/studiocms/commit/0cafedf4dee4edae1a2e859e6066365c4bea9ed5) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks APISpec to use individual Specs instead of unified spec so it will be easier to implement

- [#1434](https://github.com/withstudiocms/studiocms/pull/1434) [`ef7197e`](https://github.com/withstudiocms/studiocms/commit/ef7197ed9ca8dff757e9e791b0452279aa3791ad) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Adds SDK utility endpoints for markdown rendering and user-list HTML, replacing legacy page partial routes.
  Consumers now go through the SDK utilities for these renders, and the markdown render route is POST-based.

### Patch Changes

- [#1381](https://github.com/withstudiocms/studiocms/pull/1381) [`07b3508`](https://github.com/withstudiocms/studiocms/commit/07b35088c55a817a218b1568dd9d3f418b01a26d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Deduplicates API spec definitions and expands LocalsSessionData middleware context data

- [#1401](https://github.com/withstudiocms/studiocms/pull/1401) [`de6bb17`](https://github.com/withstudiocms/studiocms/commit/de6bb17d75f74d91776658cf1a608eebe94be495) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweaks the Rest API spec to align with current implementation

- [#1416](https://github.com/withstudiocms/studiocms/pull/1416) [`3cc5cff`](https://github.com/withstudiocms/studiocms/commit/3cc5cfffff082d6eaa1b928c1370e661b8cbde07) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Correct schema to use the Select variant instead of root variant to prevent parse errors

- [#1374](https://github.com/withstudiocms/studiocms/pull/1374) [`33d3c2b`](https://github.com/withstudiocms/studiocms/commit/33d3c2bf91cf39abc15b5df136c9eeb01b1ba317) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes import that pointed to module with server-only code

- [#1373](https://github.com/withstudiocms/studiocms/pull/1373) [`5d6ec77`](https://github.com/withstudiocms/studiocms/commit/5d6ec77bd7105118239fbd015f182e381dbfcb2c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweaks schemas to better align with real API

- Updated dependencies [[`a67bcc0`](https://github.com/withstudiocms/studiocms/commit/a67bcc0967c49d366552b76ce1f061472020ade6), [`48a5334`](https://github.com/withstudiocms/studiocms/commit/48a5334051252f4f1192faa9023d56a41f9fe95c), [`6280e24`](https://github.com/withstudiocms/studiocms/commit/6280e246369fa9732978a335ea6ddc3178f75e71), [`6c9497d`](https://github.com/withstudiocms/studiocms/commit/6c9497d29f2dd84edc3400c1f9dda98e2aaf1ec8), [`0ae47b0`](https://github.com/withstudiocms/studiocms/commit/0ae47b06a4ff03ed9cdf01b136e1a50f4c8c4add), [`9ea0cc9`](https://github.com/withstudiocms/studiocms/commit/9ea0cc90e69e98eb89c793f178928a3cff3f34a5), [`5d6ec77`](https://github.com/withstudiocms/studiocms/commit/5d6ec77bd7105118239fbd015f182e381dbfcb2c), [`33d3c2b`](https://github.com/withstudiocms/studiocms/commit/33d3c2bf91cf39abc15b5df136c9eeb01b1ba317), [`170adc4`](https://github.com/withstudiocms/studiocms/commit/170adc47216cefdce6b56e01973e3fa7812a1527), [`0ae47b0`](https://github.com/withstudiocms/studiocms/commit/0ae47b06a4ff03ed9cdf01b136e1a50f4c8c4add)]:
  - effectify@0.1.0
  - @withstudiocms/sdk@0.3.0

## 0.2.0

### Minor Changes

- [#1247](https://github.com/withstudiocms/studiocms/pull/1247) [`fb231bc`](https://github.com/withstudiocms/studiocms/commit/fb231bc06d395e1c7853e13b3b19e8695702de05) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements Auth API Spec

- [#1251](https://github.com/withstudiocms/studiocms/pull/1251) [`75c97ca`](https://github.com/withstudiocms/studiocms/commit/75c97ca15b9150a717636be75ebfd34ca465477c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks api spec naming, drops Option endpoints, and simplifies setup. This will also help provide a better client-side api interface.

- [#1253](https://github.com/withstudiocms/studiocms/pull/1253) [`26da170`](https://github.com/withstudiocms/studiocms/commit/26da170564188d034c3fd168d71b3a70e0ea2eee) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement Integrations api spec

- [#1245](https://github.com/withstudiocms/studiocms/pull/1245) [`b259143`](https://github.com/withstudiocms/studiocms/commit/b2591431465f7b43d2c67c532b0f6baa6463f423) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements new SDK api spec docs

- [#1232](https://github.com/withstudiocms/studiocms/pull/1232) [`1f7778c`](https://github.com/withstudiocms/studiocms/commit/1f7778c84ff047bc16e58d0fcc3149a78b8d5136) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduces new customized Scalar Documentation builder

- [#1268](https://github.com/withstudiocms/studiocms/pull/1268) [`ec3597e`](https://github.com/withstudiocms/studiocms/commit/ec3597ee36fb76d62ee7e95ce1c88ad3321f6062) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements Dashboard api spec

### Patch Changes

- [#1248](https://github.com/withstudiocms/studiocms/pull/1248) [`b25f4b4`](https://github.com/withstudiocms/studiocms/commit/b25f4b468915a117cb2e4224d533ddcdf1bb2c6c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Rework path parameter setup for rest api to be cleaner and easier to understand for OpenAPI

- [#1269](https://github.com/withstudiocms/studiocms/pull/1269) [`5f503e5`](https://github.com/withstudiocms/studiocms/commit/5f503e5aa4bb60360a82d5da9fea496b67577eef) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Internal code cleanup and OCD organization

- [#1229](https://github.com/withstudiocms/studiocms/pull/1229) [`8eda599`](https://github.com/withstudiocms/studiocms/commit/8eda5999ffb77d43b894e0d5f87c3ad1105ed0f3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements more of the Rest API spec

- Updated dependencies []:
  - @withstudiocms/sdk@0.2.0

## 0.1.0

### Minor Changes

- [#1202](https://github.com/withstudiocms/studiocms/pull/1202) [`cc8079f`](https://github.com/withstudiocms/studiocms/commit/cc8079f99e4ca772edea111e0c677eeba8bd663f) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Initialize new package with public rest api spec
