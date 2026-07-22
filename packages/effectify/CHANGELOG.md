# effectify

## 0.3.0

### Minor Changes

- [#1537](https://github.com/withstudiocms/studiocms/pull/1537) [`f7646fe`](https://github.com/withstudiocms/studiocms/commit/f7646fedc637f250d04844f9a6e1ac8126ec5015) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Updates for Astro v6, Lints `.astro` files, and scope CSS files to prevent weird CSS leakage across pages.

- [#1559](https://github.com/withstudiocms/studiocms/pull/1559) [`f3dcee2`](https://github.com/withstudiocms/studiocms/commit/f3dcee25fcdcab2199e849cef62e97ef54c60543) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix zod to Effect type conversion

### Patch Changes

- [#1517](https://github.com/withstudiocms/studiocms/pull/1517) [`72148f4`](https://github.com/withstudiocms/studiocms/commit/72148f4d5eae2108f6995c980d1834128da4f020) Thanks [@renovate](https://github.com/apps/renovate)! - chore(deps): Updated Effect dependencies (PR: [#1517](https://github.com/withstudiocms/studiocms/issues/1517))

- [#1563](https://github.com/withstudiocms/studiocms/pull/1563) [`a5a5769`](https://github.com/withstudiocms/studiocms/commit/a5a57694c1a273196b754acce545a8d259b3423f) Thanks [@renovate](https://github.com/apps/renovate)! - chore(deps): Updated Effect dependencies (PR: [#1563](https://github.com/withstudiocms/studiocms/issues/1563))

- [#1486](https://github.com/withstudiocms/studiocms/pull/1486) [`497ec43`](https://github.com/withstudiocms/studiocms/commit/497ec43d30436cd6042ec2be3e933b44d03491e0) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Unifies tsdown configs across project repository and updates related references

## 0.2.0

### Minor Changes

- [#1481](https://github.com/withstudiocms/studiocms/pull/1481) [`3f7e6cf`](https://github.com/withstudiocms/studiocms/commit/3f7e6cf419781e714f6802117b8ead0e3ddd7f47) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Adds new astro-integration-kit-inspired `defineIntegration` utility helper for building Astro integrations with Effect. The `defineIntegration` function introduces schema-validation for integration options using Effect Schema and automatically wraps integration hooks to surface errors as `EffectifyIntegrationHookError` instances. This provides better type safety and error handling for Astro integration authors.

  **Behavioral Changes:**

  - Integration options are now validated against the provided schema at integration initialization time, throwing `EffectifyIntegrationHookError` with `hook: 'integration:options'` for invalid options
  - All Effect-based integration hooks are automatically wrapped to catch and re-throw errors with proper context (hook name, integration name, and error details)
  - Hook errors are logged to the console and thrown as `EffectifyIntegrationHookError` instances

  **Pre-1.0 Versioning Note:** While this is technically a minor version bump (new feature addition), the introduction of schema-validation and automatic error wrapping represents a behavioral change that integration authors should be aware of. Existing code using raw Effect patterns for Astro integrations should evaluate whether to adopt this new utility for improved error handling and type safety.

## 0.1.1

### Patch Changes

- [#1463](https://github.com/withstudiocms/studiocms/pull/1463) [`d17d916`](https://github.com/withstudiocms/studiocms/commit/d17d9162c10d0d8acd628da00374983769f56828) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes import paths, build scripts, and tweaks Astro config for StudioCMS installations

## 0.1.0

### Minor Changes

- [#1309](https://github.com/withstudiocms/studiocms/pull/1309) [`6c9497d`](https://github.com/withstudiocms/studiocms/commit/6c9497d29f2dd84edc3400c1f9dda98e2aaf1ec8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduce new static assets router, useful for serving static files alongside your Effect HttpApi

- [#1284](https://github.com/withstudiocms/studiocms/pull/1284) [`9ea0cc9`](https://github.com/withstudiocms/studiocms/commit/9ea0cc90e69e98eb89c793f178928a3cff3f34a5) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - init new package

- [#1373](https://github.com/withstudiocms/studiocms/pull/1373) [`5d6ec77`](https://github.com/withstudiocms/studiocms/commit/5d6ec77bd7105118239fbd015f182e381dbfcb2c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Adds new DynamicHttpApi helper types for HttpApi handler building

### Patch Changes

- [#1334](https://github.com/withstudiocms/studiocms/pull/1334) [`a67bcc0`](https://github.com/withstudiocms/studiocms/commit/a67bcc0967c49d366552b76ce1f061472020ade6) Thanks [@renovate](https://github.com/apps/renovate)! - chore(deps): Updated Effect dependencies (PR: [#1334](https://github.com/withstudiocms/studiocms/issues/1334))

- [#1360](https://github.com/withstudiocms/studiocms/pull/1360) [`48a5334`](https://github.com/withstudiocms/studiocms/commit/48a5334051252f4f1192faa9023d56a41f9fe95c) Thanks [@renovate](https://github.com/apps/renovate)! - chore(deps): Updated Effect dependencies (PR: [#1360](https://github.com/withstudiocms/studiocms/issues/1360))

- [#1383](https://github.com/withstudiocms/studiocms/pull/1383) [`170adc4`](https://github.com/withstudiocms/studiocms/commit/170adc47216cefdce6b56e01973e3fa7812a1527) Thanks [@renovate](https://github.com/apps/renovate)! - chore(deps): Updated Effect dependencies (PR: [#1383](https://github.com/withstudiocms/studiocms/issues/1383))
