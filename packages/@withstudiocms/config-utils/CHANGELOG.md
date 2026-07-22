# @withstudiocms/config-utils

## 0.3.0

### Minor Changes

- [#1537](https://github.com/withstudiocms/studiocms/pull/1537) [`f7646fe`](https://github.com/withstudiocms/studiocms/commit/f7646fedc637f250d04844f9a6e1ac8126ec5015) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Updates for Astro v6, Lints `.astro` files, and scope CSS files to prevent weird CSS leakage across pages.

- [#1483](https://github.com/withstudiocms/studiocms/pull/1483) [`5f2a350`](https://github.com/withstudiocms/studiocms/commit/5f2a350b69429cf21d33851fb507ac930c3ccdf7) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Removes legacy configResolverBuilder in favor of new Effect based configResolverBuilderEffect which has been renamed to configResolverBuilder

- [#1606](https://github.com/withstudiocms/studiocms/pull/1606) [`b42fb34`](https://github.com/withstudiocms/studiocms/commit/b42fb347fca3c2632eccc716ad401ee962a31f76) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates to a Vite-based loader with native ESM and SSR fallback support; callers now use the filesystem-aware options API.

- [#1579](https://github.com/withstudiocms/studiocms/pull/1579) [`55b6083`](https://github.com/withstudiocms/studiocms/commit/55b6083fa48b00e125bbb06bc1e83bf846e9c7b8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Remove dependency on Astro integration kit

- [#1485](https://github.com/withstudiocms/studiocms/pull/1485) [`252798a`](https://github.com/withstudiocms/studiocms/commit/252798a1a7198487141b629ce181f99170a57558) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates internal config loading utility from esbuild to tsdown

- [#1490](https://github.com/withstudiocms/studiocms/pull/1490) [`418b743`](https://github.com/withstudiocms/studiocms/commit/418b743c6387878f82599f94ad7185947ec6815d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Moves packages to tsdown based builder instead of custom esbuild pipeline

## 0.2.0

### Minor Changes

- [#1322](https://github.com/withstudiocms/studiocms/pull/1322) [`0ae47b0`](https://github.com/withstudiocms/studiocms/commit/0ae47b06a4ff03ed9cdf01b136e1a50f4c8c4add) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate from Zod Schemas to Effect Schemas

- [#1322](https://github.com/withstudiocms/studiocms/pull/1322) [`0ae47b0`](https://github.com/withstudiocms/studiocms/commit/0ae47b06a4ff03ed9cdf01b136e1a50f4c8c4add) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update Plugin hooks to align with new schemas

- [#1308](https://github.com/withstudiocms/studiocms/pull/1308) [`5e56327`](https://github.com/withstudiocms/studiocms/commit/5e56327bf0084ab42eec8a59211a9f90a4611b81) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Adds new Effect Schema config resolver

## 0.1.0

## 0.1.0-beta.5

### Patch Changes

- [#1048](https://github.com/withstudiocms/studiocms/pull/1048) [`27fd297`](https://github.com/withstudiocms/studiocms/commit/27fd2975d8390728dc8af582ddff1a7691c9a3d2) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactors StudioCMS config processing and loading to simplify how and where configs can load. StudioCMS now no longer supports in-line config, you MUST use a `studiocms.config.*` file.

## 0.1.0-beta.4

### Patch Changes

- [#788](https://github.com/withstudiocms/studiocms/pull/788) [`9d3784c`](https://github.com/withstudiocms/studiocms/commit/9d3784c1de98a4bc7bb913742c3977e16c87cc1b) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Convert tests to vitest

- [#794](https://github.com/withstudiocms/studiocms/pull/794) [`c478f2d`](https://github.com/withstudiocms/studiocms/commit/c478f2dba7fb5cc923e0dbf0367fa2a050fcdc2d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add integration tests for @withstudiocms/config-utils.

## 0.1.0-beta.3

### Patch Changes

- [#685](https://github.com/withstudiocms/studiocms/pull/685) [`169c9be`](https://github.com/withstudiocms/studiocms/commit/169c9be7649bbd9522c6ab68a9aeca4ebfc2b86d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add tests to ensure functionality of main utils

## 0.1.0-beta.2

### Patch Changes

- [#666](https://github.com/withstudiocms/studiocms/pull/666) [`0b1574b`](https://github.com/withstudiocms/studiocms/commit/0b1574bfe32ef98dc62ed9082a132a540f0ad4ba) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweak watch config utility to be a builder akin to the configresolver util

## 0.1.0-beta.1

### Patch Changes

- [#657](https://github.com/withstudiocms/studiocms/pull/657) [`a05bb16`](https://github.com/withstudiocms/studiocms/commit/a05bb16d3dd0d1a429558b4dce316ad7fb80b049) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate to using new config utils package that contains generic config helpers instead of relying on specific ones built-in to studiocms
