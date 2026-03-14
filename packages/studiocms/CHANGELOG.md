# studiocms

## 0.4.4

### Patch Changes

- [#1480](https://github.com/withstudiocms/studiocms/pull/1480) [`aebe8bc`](https://github.com/withstudiocms/studiocms/commit/aebe8bcb3618bb07c6753e3f5c982c1fe6adea64) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix user filtering logic in RestApiSecureHandler

- Updated dependencies [[`3f7e6cf`](https://github.com/withstudiocms/studiocms/commit/3f7e6cf419781e714f6802117b8ead0e3ddd7f47)]:
  - effectify@0.2.0
  - @withstudiocms/api-spec@0.3.2
  - @withstudiocms/effect@0.4.1

## 0.4.3

### Patch Changes

- [#1470](https://github.com/withstudiocms/studiocms/pull/1470) [`66b634c`](https://github.com/withstudiocms/studiocms/commit/66b634c0b0ecbf501c948cc6b7aa1f584ea2561d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes createResetLink endpoints rank check

- [#1472](https://github.com/withstudiocms/studiocms/pull/1472) [`87f0239`](https://github.com/withstudiocms/studiocms/commit/87f02392152c83ec5796c0dc2b6d82a69d6d4641) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Improves permission checks for user ranks during user creation in the REST API endpoint

- [#1466](https://github.com/withstudiocms/studiocms/pull/1466) [`d65992d`](https://github.com/withstudiocms/studiocms/commit/d65992d780dfefb63a9bec747357cef57075b3f4) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes peerDependencies and associated metadata

- [#1471](https://github.com/withstudiocms/studiocms/pull/1471) [`66b30b7`](https://github.com/withstudiocms/studiocms/commit/66b30b73e32af52ba4d72fbc994a073ae3397749) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Prevents unauthorized modification of user notification preferences

## 0.4.2

### Patch Changes

- [#1463](https://github.com/withstudiocms/studiocms/pull/1463) [`d17d916`](https://github.com/withstudiocms/studiocms/commit/d17d9162c10d0d8acd628da00374983769f56828) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes import paths, build scripts, and tweaks Astro config for StudioCMS installations

- Updated dependencies [[`d17d916`](https://github.com/withstudiocms/studiocms/commit/d17d9162c10d0d8acd628da00374983769f56828)]:
  - @withstudiocms/api-spec@0.3.1
  - effectify@0.1.1

## 0.4.1

### Patch Changes

- [#1461](https://github.com/withstudiocms/studiocms/pull/1461) [`af78a9c`](https://github.com/withstudiocms/studiocms/commit/af78a9cf31623f96b93e3731edeff7aba6ec401a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes imports in Analytics plugin

## 0.4.0

### Minor Changes

- [#1401](https://github.com/withstudiocms/studiocms/pull/1401) [`de6bb17`](https://github.com/withstudiocms/studiocms/commit/de6bb17d75f74d91776658cf1a608eebe94be495) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates RestAPI to utilize new API-Spec package for better type safety

- [#1421](https://github.com/withstudiocms/studiocms/pull/1421) [`d7a0217`](https://github.com/withstudiocms/studiocms/commit/d7a0217e5ece55eddfa34399075614bef2041052) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Removes deprecated and unused SDK listpages endpoint, and updates the changelog json endpoint to not use .json in the pathname

- [#1433](https://github.com/withstudiocms/studiocms/pull/1433) [`64ff643`](https://github.com/withstudiocms/studiocms/commit/64ff64357f5e34960a2a044d427350bcba389304) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates StorageFileBrowser script to utilize new API spec client for typesafe API interactions

- [#1440](https://github.com/withstudiocms/studiocms/pull/1440) [`9eec9c3`](https://github.com/withstudiocms/studiocms/commit/9eec9c3b45523b635cfe16d55aa55afabacbebe3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduces new admin level api token revocation endpoint

- [#1438](https://github.com/withstudiocms/studiocms/pull/1438) [`f4a209f`](https://github.com/withstudiocms/studiocms/commit/f4a209fc090c90195e2419fff47b48a46eab7441) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactors and cleans up API spec handlers to remove un-needed variables and tighten security

- [#1448](https://github.com/withstudiocms/studiocms/pull/1448) [`35a1984`](https://github.com/withstudiocms/studiocms/commit/35a19845b30b6eed5b1273a40d99d9b405eeab9f) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Deprecates the `studiocmsMinimumVersion` setting from the plugins API, it is recommended to rely on `peerDependencies` instead.

- [#1322](https://github.com/withstudiocms/studiocms/pull/1322) [`0ae47b0`](https://github.com/withstudiocms/studiocms/commit/0ae47b06a4ff03ed9cdf01b136e1a50f4c8c4add) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate from Zod Schemas to Effect Schemas

- [#1342](https://github.com/withstudiocms/studiocms/pull/1342) [`7773e9c`](https://github.com/withstudiocms/studiocms/commit/7773e9c094802d678edb89540b82744db7a4dcbd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Moves to new data-middleware system for being able to handle dynamic authentication checks.

- [#1375](https://github.com/withstudiocms/studiocms/pull/1375) [`c9f32d0`](https://github.com/withstudiocms/studiocms/commit/c9f32d07ab88fdd11806ace656748494b5a782ec) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Extends rendering functionality to allow site-wide post-processors, or single page post-processors (augments)

- [#1430](https://github.com/withstudiocms/studiocms/pull/1430) [`a78f6d5`](https://github.com/withstudiocms/studiocms/commit/a78f6d513b0fc2bd7aa83837624460452a38539e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates dashboard components to use new api spec clients

- [#1434](https://github.com/withstudiocms/studiocms/pull/1434) [`ef7197e`](https://github.com/withstudiocms/studiocms/commit/ef7197ed9ca8dff757e9e791b0452279aa3791ad) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Adds SDK utility endpoints for markdown rendering and user-list HTML, replacing legacy page partial routes.
  Consumers now go through the SDK utilities for these renders, and the markdown render route is POST-based.

- [#1373](https://github.com/withstudiocms/studiocms/pull/1373) [`5d6ec77`](https://github.com/withstudiocms/studiocms/commit/5d6ec77bd7105118239fbd015f182e381dbfcb2c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks API handling and migrates to Effect HttpApi Spec

- [#1429](https://github.com/withstudiocms/studiocms/pull/1429) [`1cc8957`](https://github.com/withstudiocms/studiocms/commit/1cc8957db3f1e3af2c5f4763103a0d7d46aa1c6d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates various frontend pages to utilize new dashboard API client

- [#1374](https://github.com/withstudiocms/studiocms/pull/1374) [`33d3c2b`](https://github.com/withstudiocms/studiocms/commit/33d3c2bf91cf39abc15b5df136c9eeb01b1ba317) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates frontend utils to use new API spec for SDK and Auth endpoints

- [#1307](https://github.com/withstudiocms/studiocms/pull/1307) [`a855f94`](https://github.com/withstudiocms/studiocms/commit/a855f94e40b24c938dc09cdbacb72fee5a8a012a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - New Effect Schema based validation for plugin schemas

- [#1322](https://github.com/withstudiocms/studiocms/pull/1322) [`0ae47b0`](https://github.com/withstudiocms/studiocms/commit/0ae47b06a4ff03ed9cdf01b136e1a50f4c8c4add) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update Plugin hooks to align with new schemas

- [#1311](https://github.com/withstudiocms/studiocms/pull/1311) [`2d2ff4e`](https://github.com/withstudiocms/studiocms/commit/2d2ff4e180e23215dcd4f95aa850a1844e0569a8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements new Effect-based config schemas

### Patch Changes

- [#1351](https://github.com/withstudiocms/studiocms/pull/1351) [`94b6d4f`](https://github.com/withstudiocms/studiocms/commit/94b6d4f53d40d95ae7238fb91839174d61f43c8b) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes folder deletion schema calls that caused folder deletion to return a server error

- [#1381](https://github.com/withstudiocms/studiocms/pull/1381) [`07b3508`](https://github.com/withstudiocms/studiocms/commit/07b35088c55a817a218b1568dd9d3f418b01a26d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Deduplicates API spec definitions and expands LocalsSessionData middleware context data

- [#1287](https://github.com/withstudiocms/studiocms/pull/1287) [`2ea1074`](https://github.com/withstudiocms/studiocms/commit/2ea107448571e1d42bf0d21dd832b1e71e464a51) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update studiocms dependencies

- [#1336](https://github.com/withstudiocms/studiocms/pull/1336) [`e85f46b`](https://github.com/withstudiocms/studiocms/commit/e85f46b6453b7a8abfdda7d1046399a1dbc99df6) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency @inox-tools/runtime-logger to ^0.8.1

- [#1385](https://github.com/withstudiocms/studiocms/pull/1385) [`9ef4b85`](https://github.com/withstudiocms/studiocms/commit/9ef4b854ed5915d7653059154798adce4abca859) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency @iconify-json/simple-icons to ^1.2.71

- [#1402](https://github.com/withstudiocms/studiocms/pull/1402) [`2123645`](https://github.com/withstudiocms/studiocms/commit/2123645553911c3b1f97958e67f9c5f14c47d5f5) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency nanostores to ^1.1.1

- [#1442](https://github.com/withstudiocms/studiocms/pull/1442) [`ea2298e`](https://github.com/withstudiocms/studiocms/commit/ea2298e10a94a5334e75f9af806d9a03195206c8) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency @iconify-json/simple-icons to ^1.2.72

- [#1453](https://github.com/withstudiocms/studiocms/pull/1453) [`fb59e23`](https://github.com/withstudiocms/studiocms/commit/fb59e23b3d906b69b8c53430ae594a5d895180d5) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update studiocms dependencies

- [#1352](https://github.com/withstudiocms/studiocms/pull/1352) [`27fd734`](https://github.com/withstudiocms/studiocms/commit/27fd73476ccd06f4e8ec6b8a64d86319f21b083a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes outdated done page instructions

- [#1446](https://github.com/withstudiocms/studiocms/pull/1446) [`7d2ebfb`](https://github.com/withstudiocms/studiocms/commit/7d2ebfb35a77982b31a7edc95bce01223f77cf15) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Code cleanup and OCD, purges dead and unused code

- [#1441](https://github.com/withstudiocms/studiocms/pull/1441) [`39e367d`](https://github.com/withstudiocms/studiocms/commit/39e367d1433ef577b018586b347216df92e21d20) Thanks [@renovate](https://github.com/apps/renovate)! - fixes CSS lint error with duplicate CSS variable

- [#1422](https://github.com/withstudiocms/studiocms/pull/1422) [`de78276`](https://github.com/withstudiocms/studiocms/commit/de78276f1f940be413a1510aa57cc4caa2aac6fd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Ensures proper permissions for API route, and updates client script to align with new API spec

- [#1353](https://github.com/withstudiocms/studiocms/pull/1353) [`54d5a3e`](https://github.com/withstudiocms/studiocms/commit/54d5a3eaec5b6bf3d75c190cf31f80ca27ebd96e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes `studiocms init` optional option parsing

- [#1281](https://github.com/withstudiocms/studiocms/pull/1281) [`b5d5719`](https://github.com/withstudiocms/studiocms/commit/b5d5719b612545622813f1a944313e61a08e50f8) Thanks [@renovate](https://github.com/apps/renovate)! - lint

- [#1420](https://github.com/withstudiocms/studiocms/pull/1420) [`139b3a6`](https://github.com/withstudiocms/studiocms/commit/139b3a6820c848c9052e319f53a855172e023091) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Adds new config option for built-in API spec docs available in studiocms config as a boolean option `features.api.apiDocs`

- Updated dependencies [[`a67bcc0`](https://github.com/withstudiocms/studiocms/commit/a67bcc0967c49d366552b76ce1f061472020ade6), [`d7a0217`](https://github.com/withstudiocms/studiocms/commit/d7a0217e5ece55eddfa34399075614bef2041052), [`48a5334`](https://github.com/withstudiocms/studiocms/commit/48a5334051252f4f1192faa9023d56a41f9fe95c), [`07b3508`](https://github.com/withstudiocms/studiocms/commit/07b35088c55a817a218b1568dd9d3f418b01a26d), [`6280e24`](https://github.com/withstudiocms/studiocms/commit/6280e246369fa9732978a335ea6ddc3178f75e71), [`9a1180c`](https://github.com/withstudiocms/studiocms/commit/9a1180c6fe1e09599aa63a323ffcc4ba081a6e16), [`fbb5e47`](https://github.com/withstudiocms/studiocms/commit/fbb5e4749674ff4fd0593f37ae29614061d1f362), [`b7b76cb`](https://github.com/withstudiocms/studiocms/commit/b7b76cbb8e3b4ea4fe7f0d86e4f57acac47a94fe), [`3cff26c`](https://github.com/withstudiocms/studiocms/commit/3cff26c53e7b8ec1781ec7c390666a0276f50c46), [`5c0c17b`](https://github.com/withstudiocms/studiocms/commit/5c0c17b17a65046bcb93654d8bd7b0bfdad4c773), [`ff4e543`](https://github.com/withstudiocms/studiocms/commit/ff4e543a516350cd4139827b925061d8355d4932), [`ba50598`](https://github.com/withstudiocms/studiocms/commit/ba50598168030af18ccea5fedb263379507d5112), [`26d0584`](https://github.com/withstudiocms/studiocms/commit/26d05848b444cb53a26c6e89baa83203bf0398cc), [`466d3c5`](https://github.com/withstudiocms/studiocms/commit/466d3c599fdf54b95788e377cd0c817a53bb6fd3), [`d0ef542`](https://github.com/withstudiocms/studiocms/commit/d0ef542490b45bc65e276c30ae422b3386ed9f88), [`9eec9c3`](https://github.com/withstudiocms/studiocms/commit/9eec9c3b45523b635cfe16d55aa55afabacbebe3), [`f4a209f`](https://github.com/withstudiocms/studiocms/commit/f4a209fc090c90195e2419fff47b48a46eab7441), [`d0ef542`](https://github.com/withstudiocms/studiocms/commit/d0ef542490b45bc65e276c30ae422b3386ed9f88), [`6c9497d`](https://github.com/withstudiocms/studiocms/commit/6c9497d29f2dd84edc3400c1f9dda98e2aaf1ec8), [`0ae47b0`](https://github.com/withstudiocms/studiocms/commit/0ae47b06a4ff03ed9cdf01b136e1a50f4c8c4add), [`0cafedf`](https://github.com/withstudiocms/studiocms/commit/0cafedf4dee4edae1a2e859e6066365c4bea9ed5), [`de6bb17`](https://github.com/withstudiocms/studiocms/commit/de6bb17d75f74d91776658cf1a608eebe94be495), [`1e13417`](https://github.com/withstudiocms/studiocms/commit/1e1341773ea163ae25529b14877078e965899a30), [`9ea0cc9`](https://github.com/withstudiocms/studiocms/commit/9ea0cc90e69e98eb89c793f178928a3cff3f34a5), [`3cc5cff`](https://github.com/withstudiocms/studiocms/commit/3cc5cfffff082d6eaa1b928c1370e661b8cbde07), [`ef7197e`](https://github.com/withstudiocms/studiocms/commit/ef7197ed9ca8dff757e9e791b0452279aa3791ad), [`5d6ec77`](https://github.com/withstudiocms/studiocms/commit/5d6ec77bd7105118239fbd015f182e381dbfcb2c), [`33d3c2b`](https://github.com/withstudiocms/studiocms/commit/33d3c2bf91cf39abc15b5df136c9eeb01b1ba317), [`170adc4`](https://github.com/withstudiocms/studiocms/commit/170adc47216cefdce6b56e01973e3fa7812a1527), [`5d6ec77`](https://github.com/withstudiocms/studiocms/commit/5d6ec77bd7105118239fbd015f182e381dbfcb2c), [`0ae47b0`](https://github.com/withstudiocms/studiocms/commit/0ae47b06a4ff03ed9cdf01b136e1a50f4c8c4add), [`ae9ce1f`](https://github.com/withstudiocms/studiocms/commit/ae9ce1f73545a9db6b54b2bffc145a59ca598aaf), [`9eec9c3`](https://github.com/withstudiocms/studiocms/commit/9eec9c3b45523b635cfe16d55aa55afabacbebe3), [`8743206`](https://github.com/withstudiocms/studiocms/commit/87432066bf8c6788f1af0840b9a793e03d119815), [`5e56327`](https://github.com/withstudiocms/studiocms/commit/5e56327bf0084ab42eec8a59211a9f90a4611b81), [`b5d5719`](https://github.com/withstudiocms/studiocms/commit/b5d5719b612545622813f1a944313e61a08e50f8)]:
  - @withstudiocms/effect@0.4.0
  - effectify@0.1.0
  - @withstudiocms/api-spec@0.3.0
  - @withstudiocms/sdk@0.3.0
  - @withstudiocms/cli-kit@0.2.1
  - @withstudiocms/internal_helpers@0.2.0
  - @withstudiocms/kysely@0.2.1
  - @withstudiocms/config-utils@0.2.0
  - @withstudiocms/auth-kit@0.1.4
  - @withstudiocms/component-registry@0.1.4

## 0.3.0

### Minor Changes

- [#1254](https://github.com/withstudiocms/studiocms/pull/1254) [`180b959`](https://github.com/withstudiocms/studiocms/commit/180b95972f9d51731eb570685e251532cbae2f62) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Replaces chalk with node:util's styleText

- [#1271](https://github.com/withstudiocms/studiocms/pull/1271) [`9a450cb`](https://github.com/withstudiocms/studiocms/commit/9a450cb9167e2f2ea4c197bc812131d2fdeda6c9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Removes deprecated and unused virtual modules.

  The following modules have been removed.

  - `studiocms:astro-config/adapter`
  - `studiocms:auth/utils/getLabelForPermissionLevel`
  - `virtual:studiocms/sdk/env`

### Patch Changes

- [#1237](https://github.com/withstudiocms/studiocms/pull/1237) [`fb6c96a`](https://github.com/withstudiocms/studiocms/commit/fb6c96ac6ae25887a0f673618770a67b2deffae6) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update studiocms dependencies

- [#1259](https://github.com/withstudiocms/studiocms/pull/1259) [`0525390`](https://github.com/withstudiocms/studiocms/commit/05253906d33a9b7bd12a27cdf2b8c9e9f693177f) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update studiocms dependencies

- [#1267](https://github.com/withstudiocms/studiocms/pull/1267) [`d56b066`](https://github.com/withstudiocms/studiocms/commit/d56b066554848d819cc3dd59cfacfbda51565ad5) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency @nanostores/persistent to ^1.3.0

- [#1255](https://github.com/withstudiocms/studiocms/pull/1255) [`e12e074`](https://github.com/withstudiocms/studiocms/commit/e12e074e6432398181be1f58f5c89df96a516cbb) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix new type issues due to updated clack version

- [#1270](https://github.com/withstudiocms/studiocms/pull/1270) [`c9727f7`](https://github.com/withstudiocms/studiocms/commit/c9727f7a218113d68254de825b84ddb926721b56) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes issue with pg and mysql2 being required to be installed when they should be optional

- [#1272](https://github.com/withstudiocms/studiocms/pull/1272) [`38e74bb`](https://github.com/withstudiocms/studiocms/commit/38e74bbeec97e054e8545d6665452c5246a1fdd3) Thanks [@RATIU5](https://github.com/RATIU5)! - Fix client regex in frontend to allow for slashes within a slug, but not on the outside. This unblocks creating pages under sub-paths just using the slug (e.g., `docs/getting-started`) and only affects client-side validation.

- [#1265](https://github.com/withstudiocms/studiocms/pull/1265) [`6d9b601`](https://github.com/withstudiocms/studiocms/commit/6d9b601b0a29ca2221d47efa65bc1356870e0339) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Removes legacy email domain verification code

- [#1231](https://github.com/withstudiocms/studiocms/pull/1231) [`e7b39ef`](https://github.com/withstudiocms/studiocms/commit/e7b39ef6c3e1e2a54201e200b32fb1c02cd5fc3e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes default 404 route rendering

- Updated dependencies [[`6b826b8`](https://github.com/withstudiocms/studiocms/commit/6b826b80104fe23e35763edf275f1800e5629c32), [`8b46bf5`](https://github.com/withstudiocms/studiocms/commit/8b46bf5861f3ab884bb8cbac1b73a1e97fcabe96), [`f129eec`](https://github.com/withstudiocms/studiocms/commit/f129eec8d0a6f18c446c319dec9925cc31a890b4), [`e12e074`](https://github.com/withstudiocms/studiocms/commit/e12e074e6432398181be1f58f5c89df96a516cbb)]:
  - @withstudiocms/internal_helpers@0.1.1
  - @withstudiocms/effect@0.3.0
  - @withstudiocms/auth-kit@0.1.3
  - @withstudiocms/component-registry@0.1.3
  - @withstudiocms/sdk@0.2.0

## 0.2.0

### Minor Changes

- [#1197](https://github.com/withstudiocms/studiocms/pull/1197) [`4b542ec`](https://github.com/withstudiocms/studiocms/commit/4b542eca8934996f7ed9eaf1c9f040305ea5e471) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweaks optional dependencies, and chunkSizeWarningLimit for Astro config to prevent warnings from WYSIWYG plugin

- [#1219](https://github.com/withstudiocms/studiocms/pull/1219) [`9122ddd`](https://github.com/withstudiocms/studiocms/commit/9122ddd16f9c7ab61c5df227ae7a81edd8620bb0) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Move to updated and migrated cli-kit package

### Patch Changes

- [#1222](https://github.com/withstudiocms/studiocms/pull/1222) [`0f6b4c7`](https://github.com/withstudiocms/studiocms/commit/0f6b4c74886f09ebf35ee73d5d8579d26f8e534a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweaks package linking to pnpm catalog

- [#1211](https://github.com/withstudiocms/studiocms/pull/1211) [`b269e44`](https://github.com/withstudiocms/studiocms/commit/b269e44d68c8fd0da8eb3147c75b7d1cc899580d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Adds regex and proper error handling to prevent illegal characters (non-url-safe) from being used for S3 objects.

- [#1220](https://github.com/withstudiocms/studiocms/pull/1220) [`3324f2b`](https://github.com/withstudiocms/studiocms/commit/3324f2be74a6c7d21005d1cc0b4a8695f376c53b) Thanks [@kunjabijukchhe](https://github.com/kunjabijukchhe)! - Fixes an issue where saving a page that does not have `draft` set to true, would previously update the `publishedAt` date value.

- [#1214](https://github.com/withstudiocms/studiocms/pull/1214) [`efc10be`](https://github.com/withstudiocms/studiocms/commit/efc10bee20db090fdd75463622c30dda390c50ad) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix: Reworks permission checks for dashboard routes to be at the middleware level to prevent unauthorized access

- Updated dependencies [[`0f6b4c7`](https://github.com/withstudiocms/studiocms/commit/0f6b4c74886f09ebf35ee73d5d8579d26f8e534a), [`93e62f6`](https://github.com/withstudiocms/studiocms/commit/93e62f65f779192403361826bc2a7fb997762521), [`2dd709f`](https://github.com/withstudiocms/studiocms/commit/2dd709f7f83efbb64c4ccb83f49db2d589ca9404), [`0f6b4c7`](https://github.com/withstudiocms/studiocms/commit/0f6b4c74886f09ebf35ee73d5d8579d26f8e534a), [`4b542ec`](https://github.com/withstudiocms/studiocms/commit/4b542eca8934996f7ed9eaf1c9f040305ea5e471), [`4b542ec`](https://github.com/withstudiocms/studiocms/commit/4b542eca8934996f7ed9eaf1c9f040305ea5e471), [`e628b43`](https://github.com/withstudiocms/studiocms/commit/e628b431f3128da1ad378138bdda2ca14794e76e), [`8a0ea71`](https://github.com/withstudiocms/studiocms/commit/8a0ea7176350b9526203d5722e1ff45d7fe6dfeb), [`59e5517`](https://github.com/withstudiocms/studiocms/commit/59e5517963cfd5f62fd3631b5ee69ae1e423ef50), [`c68668b`](https://github.com/withstudiocms/studiocms/commit/c68668b0a83341dd6cbdc378e1673017afef1d73)]:
  - @withstudiocms/cli-kit@0.2.0
  - @withstudiocms/effect@0.2.0
  - @withstudiocms/kysely@0.2.0
  - @withstudiocms/sdk@0.2.0
  - @withstudiocms/auth-kit@0.1.2
  - @withstudiocms/component-registry@0.1.2

## 0.1.1

### Patch Changes

- [#1181](https://github.com/withstudiocms/studiocms/pull/1181) [`a169a89`](https://github.com/withstudiocms/studiocms/commit/a169a893338947b425e87057cc77401f33abcbfd) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency @iconify-json/simple-icons to ^1.2.66

- [#1186](https://github.com/withstudiocms/studiocms/pull/1186) [`415a512`](https://github.com/withstudiocms/studiocms/commit/415a51241ffddf5045ad8f8d695a5f40a86b5af7) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix workspace package dependency specifiers

- [#1187](https://github.com/withstudiocms/studiocms/pull/1187) [`1b2a0c5`](https://github.com/withstudiocms/studiocms/commit/1b2a0c57299544caeba18205ca85a8ca0381d7cb) Thanks [@aliozinan](https://github.com/aliozinan)! - Fix create folder bug in s3-storage PUT request handler

- Updated dependencies [[`415a512`](https://github.com/withstudiocms/studiocms/commit/415a51241ffddf5045ad8f8d695a5f40a86b5af7)]:
  - @withstudiocms/component-registry@0.1.1
  - @withstudiocms/auth-kit@0.1.1
  - @withstudiocms/sdk@0.1.1

## 0.1.0

### Patch Changes

- [#1151](https://github.com/withstudiocms/studiocms/pull/1151) [`25e6fc0`](https://github.com/withstudiocms/studiocms/commit/25e6fc0cca879e77c49c35da5e9a28e582957988) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates table imports to new `@withstudiocms/sdk/tables` export, and update other relevant imports

- [#1153](https://github.com/withstudiocms/studiocms/pull/1153) [`0435b82`](https://github.com/withstudiocms/studiocms/commit/0435b82fbc40af767f065a990639b44cfefecf4d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update imports for Migrator to `@withstudiocms/sdk/migrator`

- [#1132](https://github.com/withstudiocms/studiocms/pull/1132) [`e1c3052`](https://github.com/withstudiocms/studiocms/commit/e1c30524e7fd6ed8f7b85874f049d36ffb50afc8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor REST-API structure

- [#1134](https://github.com/withstudiocms/studiocms/pull/1134) [`3a27939`](https://github.com/withstudiocms/studiocms/commit/3a279390d2688d464fc5476fac0faf2bada2c1fd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks table types to better align with actual table schema

- [#1142](https://github.com/withstudiocms/studiocms/pull/1142) [`4b676ca`](https://github.com/withstudiocms/studiocms/commit/4b676ca9fe4a603d036c0d9e680fd5bed997cab2) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Consolidates auth api routes

- [#1112](https://github.com/withstudiocms/studiocms/pull/1112) [`28f0e56`](https://github.com/withstudiocms/studiocms/commit/28f0e5614ae07c3f73b9c9fd102cd9bb8b912ca9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements new FolderTree rendering system and updated content management inner sidebar

- [#1128](https://github.com/withstudiocms/studiocms/pull/1128) [`96c98c2`](https://github.com/withstudiocms/studiocms/commit/96c98c2e420bf8526611e674f1f58dd3fa2f33a3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweak categories and tag ID generation to try to solve ID issue with database entry, and enable categories and tag entry on pageData

- [#1124](https://github.com/withstudiocms/studiocms/pull/1124) [`7c8a684`](https://github.com/withstudiocms/studiocms/commit/7c8a68431f9087d4c3b65b06c76093b462dcddb1) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency @iconify-json/simple-icons to ^1.2.64

- [#1108](https://github.com/withstudiocms/studiocms/pull/1108) [`36eead9`](https://github.com/withstudiocms/studiocms/commit/36eead9e3b002491f1d3ddd562479b0ea381e2c0) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - dedupes storage manager resolver utility

- [#1141](https://github.com/withstudiocms/studiocms/pull/1141) [`9c350ea`](https://github.com/withstudiocms/studiocms/commit/9c350ea47118aa83738ded08b01a2ee3c98875a9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Consolidates the db-studio and storage api handlers into a new unified integrations route.

- [#1136](https://github.com/withstudiocms/studiocms/pull/1136) [`3ab68b4`](https://github.com/withstudiocms/studiocms/commit/3ab68b4de1ba2730d5acf16804c5b452fb7fcc43) Thanks [@louisescher](https://github.com/louisescher)! - Fixes various CSS issues across all dashboard and auth pages.

- [#1157](https://github.com/withstudiocms/studiocms/pull/1157) [`f8a2d34`](https://github.com/withstudiocms/studiocms/commit/f8a2d342cc3c35bf4478bb523bf28d78dd2d0404) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add effect-language-service diagnostics scripts to all workspace packages

- [#1107](https://github.com/withstudiocms/studiocms/pull/1107) [`3cf47d9`](https://github.com/withstudiocms/studiocms/commit/3cf47d90c38c1b70a1378dabe6e72bf4a0ae467c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Creates user-available resolver utils to call dynamic storage api

- [#1106](https://github.com/withstudiocms/studiocms/pull/1106) [`4ece96b`](https://github.com/withstudiocms/studiocms/commit/4ece96bb9b9a3180a2d840dc64ee647371ff693e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Integrates Storage Manager API for Custom Image component to resolve image urls from storage

- [#1103](https://github.com/withstudiocms/studiocms/pull/1103) [`249b674`](https://github.com/withstudiocms/studiocms/commit/249b67423122c589fd15ea83518837d11c444b11) Thanks [@apollo-git-bot](https://github.com/apps/apollo-git-bot)! - Translation Updated (PR: #1103)

- [#1150](https://github.com/withstudiocms/studiocms/pull/1150) [`7439f48`](https://github.com/withstudiocms/studiocms/commit/7439f485691f7c95397e2da46f509fa36e55cd48) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Cleans up and consolidates all page partial routes

- [#1166](https://github.com/withstudiocms/studiocms/pull/1166) [`feb85ad`](https://github.com/withstudiocms/studiocms/commit/feb85ada2084e4e83e3dfbb47b89f747a41979a0) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Replace instance of .returning/returningAll with transactions to properly support SQL dialects that do not support returning such as MySQL

- [#1119](https://github.com/withstudiocms/studiocms/pull/1119) [`45b9470`](https://github.com/withstudiocms/studiocms/commit/45b9470867c552e87e5ea1f68e20f5e4386233ff) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements taxonomy management into the REST_API

- [#1116](https://github.com/withstudiocms/studiocms/pull/1116) [`845f147`](https://github.com/withstudiocms/studiocms/commit/845f14732a2d2a76159027b9ed29695f62ebf22c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks search into its own component and script so that it is easier to maintain, also streamlines search result design to align with new tree styles

- [#1144](https://github.com/withstudiocms/studiocms/pull/1144) [`dfa40ff`](https://github.com/withstudiocms/studiocms/commit/dfa40ff0c145ef70c7f8d2bb6bd7aaf467e934d0) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Cleans up pnpm catalog dependencies

- [#1138](https://github.com/withstudiocms/studiocms/pull/1138) [`db2778a`](https://github.com/withstudiocms/studiocms/commit/db2778ae77944a1e8bb362e49215cfefff5223d0) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - More RestAPI cleanup, and cleans up SDK api endpoints

- [#1129](https://github.com/withstudiocms/studiocms/pull/1129) [`d59c4b0`](https://github.com/withstudiocms/studiocms/commit/d59c4b00d44b65bae84315d34fa3b721f9621136) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Replaced `@libsql/kysely-libsql` with `kysely-turso`

  #### BREAKING UPDATE

  All previous installs relying on `@libsql/kysely-libsql` should remove the old dependency and install the new `kysely-turso` dependency.

- [#1100](https://github.com/withstudiocms/studiocms/pull/1100) [`d5c77ea`](https://github.com/withstudiocms/studiocms/commit/d5c77eaf352e0ce3d45b0ce761ce6370e5a7a4ff) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements file browser on site config and content management pages

- [#1101](https://github.com/withstudiocms/studiocms/pull/1101) [`8f53993`](https://github.com/withstudiocms/studiocms/commit/8f539933716b9d3335a13c180e3c607e44a63f8a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduces new transformer option in component registry and creates new StorageAPI transformer to allow Storage API automatic url swapping

- [#1160](https://github.com/withstudiocms/studiocms/pull/1160) [`30de271`](https://github.com/withstudiocms/studiocms/commit/30de271f347a3a997669c8118006143148efb33a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactors code to handle Effect LSP diagnostic warnings and errors

- [#1111](https://github.com/withstudiocms/studiocms/pull/1111) [`e26ff92`](https://github.com/withstudiocms/studiocms/commit/e26ff92c731776156dfdb6830b5ebbccaf05acbf) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements new component registry UI for content editing and System management pages.

- [#1117](https://github.com/withstudiocms/studiocms/pull/1117) [`87a5ed0`](https://github.com/withstudiocms/studiocms/commit/87a5ed0fdf3a23b0c743f38a42a814b7d68f496d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements categories and tags management for the StudioCMS Dashboard

- [#1172](https://github.com/withstudiocms/studiocms/pull/1172) [`3af3578`](https://github.com/withstudiocms/studiocms/commit/3af357827ad2ef1f2a7c41b8b4d459ecc743fc69) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update readme to remove beta warning

- [#1163](https://github.com/withstudiocms/studiocms/pull/1163) [`cd865cf`](https://github.com/withstudiocms/studiocms/commit/cd865cf995c3b926900b347ee0782d9ccecc1d4f) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Removes deprecated hideDefaultIndex site config variable from SDK and updates all instances of usage in StudioCMS

  #### Breaking Change

  Note for anyone previously relying on this feature, it has now been completely removed. Users will need to adjust any code relying on this functionality.

- [#1099](https://github.com/withstudiocms/studiocms/pull/1099) [`359e655`](https://github.com/withstudiocms/studiocms/commit/359e65541206e5d10c3fef67666bc883f81e2f85) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduces StorageManager API to SDK and allow resolving image urls for site config and pagedata

- [#1137](https://github.com/withstudiocms/studiocms/pull/1137) [`860337f`](https://github.com/withstudiocms/studiocms/commit/860337f73d2c6bb56135f16146c524721600057e) Thanks [@louisescher](https://github.com/louisescher)! - Fixes edit page tabs overflowing

- [#1098](https://github.com/withstudiocms/studiocms/pull/1098) [`80285ec`](https://github.com/withstudiocms/studiocms/commit/80285ecf94078c1f99912fa88bd230a42e106bbd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add file browser access to system management page with identifier output utility

- [#1135](https://github.com/withstudiocms/studiocms/pull/1135) [`1e85356`](https://github.com/withstudiocms/studiocms/commit/1e8535629363c518549ff3606710ae000245aa8a) Thanks [@louisescher](https://github.com/louisescher)! - Adjusts CSS to allow for a full-size editor window and fixes some spacing on the editor page.

- [#1102](https://github.com/withstudiocms/studiocms/pull/1102) [`c36800e`](https://github.com/withstudiocms/studiocms/commit/c36800e5e13173e6d3a030d060774d223892d6e2) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements Storage manager url generator for content edit page

- [#1126](https://github.com/withstudiocms/studiocms/pull/1126) [`4a4db87`](https://github.com/withstudiocms/studiocms/commit/4a4db87f755bf9e5f6d46c8daa04a48591395dff) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks CLI to fix async/sync code handling for `studiocms users` command

- Updated dependencies [[`25e6fc0`](https://github.com/withstudiocms/studiocms/commit/25e6fc0cca879e77c49c35da5e9a28e582957988), [`87a5ed0`](https://github.com/withstudiocms/studiocms/commit/87a5ed0fdf3a23b0c743f38a42a814b7d68f496d), [`3a27939`](https://github.com/withstudiocms/studiocms/commit/3a279390d2688d464fc5476fac0faf2bada2c1fd), [`96c98c2`](https://github.com/withstudiocms/studiocms/commit/96c98c2e420bf8526611e674f1f58dd3fa2f33a3), [`87d36ba`](https://github.com/withstudiocms/studiocms/commit/87d36ba83d24d83c7b2b17daa47231a63c225fa2), [`fc33e3f`](https://github.com/withstudiocms/studiocms/commit/fc33e3fb2c3568331be89b43a3a892317834f43a), [`9bde767`](https://github.com/withstudiocms/studiocms/commit/9bde7670e3813828615354ec5f99b5188487eb48), [`f8a2d34`](https://github.com/withstudiocms/studiocms/commit/f8a2d342cc3c35bf4478bb523bf28d78dd2d0404), [`e359a69`](https://github.com/withstudiocms/studiocms/commit/e359a69d2cad6db0b665908bdee67f02d418877a), [`b4d7879`](https://github.com/withstudiocms/studiocms/commit/b4d7879ae9ea93f199bcf187c8cd940efb405ad9), [`feb85ad`](https://github.com/withstudiocms/studiocms/commit/feb85ada2084e4e83e3dfbb47b89f747a41979a0), [`4ffae83`](https://github.com/withstudiocms/studiocms/commit/4ffae83377c75efe7c26c45d3cb360394fba5001), [`d59c4b0`](https://github.com/withstudiocms/studiocms/commit/d59c4b00d44b65bae84315d34fa3b721f9621136), [`cb8ffda`](https://github.com/withstudiocms/studiocms/commit/cb8ffda2d6fb31e3a754996b3e938a5c1b643af1), [`e1c3052`](https://github.com/withstudiocms/studiocms/commit/e1c30524e7fd6ed8f7b85874f049d36ffb50afc8), [`9007ca5`](https://github.com/withstudiocms/studiocms/commit/9007ca5d8d6c471ee25f07bd2f0a101ba195440c), [`8f53993`](https://github.com/withstudiocms/studiocms/commit/8f539933716b9d3335a13c180e3c607e44a63f8a), [`30de271`](https://github.com/withstudiocms/studiocms/commit/30de271f347a3a997669c8118006143148efb33a), [`9bde767`](https://github.com/withstudiocms/studiocms/commit/9bde7670e3813828615354ec5f99b5188487eb48), [`cd865cf`](https://github.com/withstudiocms/studiocms/commit/cd865cf995c3b926900b347ee0782d9ccecc1d4f), [`359e655`](https://github.com/withstudiocms/studiocms/commit/359e65541206e5d10c3fef67666bc883f81e2f85), [`0435b82`](https://github.com/withstudiocms/studiocms/commit/0435b82fbc40af767f065a990639b44cfefecf4d)]:
  - @withstudiocms/kysely@0.1.0
  - @withstudiocms/sdk@0.1.0
  - @withstudiocms/auth-kit@0.1.0
  - @withstudiocms/effect@0.1.0
  - @withstudiocms/component-registry@0.1.0
  - @withstudiocms/config-utils@0.1.0
  - @withstudiocms/internal_helpers@0.1.0
  - @withstudiocms/template-lang@0.1.0

## 0.1.0-beta.32

### Patch Changes

- For previous version changelogs, see [CHANGELOG.beta.md](./CHANGELOG.beta.md)
