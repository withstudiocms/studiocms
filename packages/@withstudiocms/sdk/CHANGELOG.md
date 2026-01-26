# @withstudiocms/sdk

## 0.2.0

### Minor Changes

- [#1197](https://github.com/withstudiocms/studiocms/pull/1197) [`4b542ec`](https://github.com/withstudiocms/studiocms/commit/4b542eca8934996f7ed9eaf1c9f040305ea5e471) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweaks dependencies to prevent weird dep issues

### Patch Changes

- [#1199](https://github.com/withstudiocms/studiocms/pull/1199) [`8a0ea71`](https://github.com/withstudiocms/studiocms/commit/8a0ea7176350b9526203d5722e1ff45d7fe6dfeb) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reverse diff history order for page edit history getter

## 0.1.1

### Patch Changes

- [#1186](https://github.com/withstudiocms/studiocms/pull/1186) [`415a512`](https://github.com/withstudiocms/studiocms/commit/415a51241ffddf5045ad8f8d695a5f40a86b5af7) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix workspace package dependency specifiers

## 0.1.0

### Patch Changes

- [#1151](https://github.com/withstudiocms/studiocms/pull/1151) [`25e6fc0`](https://github.com/withstudiocms/studiocms/commit/25e6fc0cca879e77c49c35da5e9a28e582957988) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates table schemas from `@withstudiocms/kysely` to `@withstudiocms/sdk` package

- [#1117](https://github.com/withstudiocms/studiocms/pull/1117) [`87a5ed0`](https://github.com/withstudiocms/studiocms/commit/87a5ed0fdf3a23b0c743f38a42a814b7d68f496d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement category and tag getters

- [#1134](https://github.com/withstudiocms/studiocms/pull/1134) [`3a27939`](https://github.com/withstudiocms/studiocms/commit/3a279390d2688d464fc5476fac0faf2bada2c1fd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks table types to better align with actual table schema

- [#1128](https://github.com/withstudiocms/studiocms/pull/1128) [`96c98c2`](https://github.com/withstudiocms/studiocms/commit/96c98c2e420bf8526611e674f1f58dd3fa2f33a3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweak categories and tag ID generation to try to solve ID issue with database entry, and enable categories and tag entry on pageData

- [#1140](https://github.com/withstudiocms/studiocms/pull/1140) [`fc33e3f`](https://github.com/withstudiocms/studiocms/commit/fc33e3fb2c3568331be89b43a3a892317834f43a) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency diff2html to ^3.4.55

- [#1157](https://github.com/withstudiocms/studiocms/pull/1157) [`f8a2d34`](https://github.com/withstudiocms/studiocms/commit/f8a2d342cc3c35bf4478bb523bf28d78dd2d0404) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add effect-language-service diagnostics scripts to all workspace packages

- [#1166](https://github.com/withstudiocms/studiocms/pull/1166) [`feb85ad`](https://github.com/withstudiocms/studiocms/commit/feb85ada2084e4e83e3dfbb47b89f747a41979a0) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Replace instance of .returning/returningAll with transactions to properly support SQL dialects that do not support returning such as MySQL

- [#1164](https://github.com/withstudiocms/studiocms/pull/1164) [`4ffae83`](https://github.com/withstudiocms/studiocms/commit/4ffae83377c75efe7c26c45d3cb360394fba5001) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements draft exclusion for GET.pageFolderTree(excludeDrafts?) in the SDK.

- [#1132](https://github.com/withstudiocms/studiocms/pull/1132) [`e1c3052`](https://github.com/withstudiocms/studiocms/commit/e1c30524e7fd6ed8f7b85874f049d36ffb50afc8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Ensures pageData does not surface any sensitive data

- [#1160](https://github.com/withstudiocms/studiocms/pull/1160) [`30de271`](https://github.com/withstudiocms/studiocms/commit/30de271f347a3a997669c8118006143148efb33a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactors code to handle Effect LSP diagnostic warnings and errors

- [#1168](https://github.com/withstudiocms/studiocms/pull/1168) [`9bde767`](https://github.com/withstudiocms/studiocms/commit/9bde7670e3813828615354ec5f99b5188487eb48) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix page slug collector

- [#1163](https://github.com/withstudiocms/studiocms/pull/1163) [`cd865cf`](https://github.com/withstudiocms/studiocms/commit/cd865cf995c3b926900b347ee0782d9ccecc1d4f) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Removes deprecated hideDefaultIndex site config variable from SDK and updates all instances of usage in StudioCMS

  #### Breaking Change

  Note for anyone previously relying on this feature, it has now been completely removed. Users will need to adjust any code relying on this functionality.

- [#1099](https://github.com/withstudiocms/studiocms/pull/1099) [`359e655`](https://github.com/withstudiocms/studiocms/commit/359e65541206e5d10c3fef67666bc883f81e2f85) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduces StorageManager API to SDK and allow resolving image urls for site config and pagedata

- [#1153](https://github.com/withstudiocms/studiocms/pull/1153) [`0435b82`](https://github.com/withstudiocms/studiocms/commit/0435b82fbc40af767f065a990639b44cfefecf4d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Move custom StudioCMS migrations from `@withstudiocms/kysely` package to `@withstudiocms/sdk`

- Updated dependencies [[`25e6fc0`](https://github.com/withstudiocms/studiocms/commit/25e6fc0cca879e77c49c35da5e9a28e582957988), [`3a27939`](https://github.com/withstudiocms/studiocms/commit/3a279390d2688d464fc5476fac0faf2bada2c1fd), [`87d36ba`](https://github.com/withstudiocms/studiocms/commit/87d36ba83d24d83c7b2b17daa47231a63c225fa2), [`9bde767`](https://github.com/withstudiocms/studiocms/commit/9bde7670e3813828615354ec5f99b5188487eb48), [`f8a2d34`](https://github.com/withstudiocms/studiocms/commit/f8a2d342cc3c35bf4478bb523bf28d78dd2d0404), [`e359a69`](https://github.com/withstudiocms/studiocms/commit/e359a69d2cad6db0b665908bdee67f02d418877a), [`b4d7879`](https://github.com/withstudiocms/studiocms/commit/b4d7879ae9ea93f199bcf187c8cd940efb405ad9), [`d59c4b0`](https://github.com/withstudiocms/studiocms/commit/d59c4b00d44b65bae84315d34fa3b721f9621136), [`cb8ffda`](https://github.com/withstudiocms/studiocms/commit/cb8ffda2d6fb31e3a754996b3e938a5c1b643af1), [`30de271`](https://github.com/withstudiocms/studiocms/commit/30de271f347a3a997669c8118006143148efb33a), [`0435b82`](https://github.com/withstudiocms/studiocms/commit/0435b82fbc40af767f065a990639b44cfefecf4d)]:
  - @withstudiocms/kysely@0.1.0
  - @withstudiocms/effect@0.1.0

## 0.1.0-beta.2

### Patch Changes

- [#1151](https://github.com/withstudiocms/studiocms/pull/1151) [`25e6fc0`](https://github.com/withstudiocms/studiocms/commit/25e6fc0cca879e77c49c35da5e9a28e582957988) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates table schemas from `@withstudiocms/kysely` to `@withstudiocms/sdk` package

- [#1117](https://github.com/withstudiocms/studiocms/pull/1117) [`87a5ed0`](https://github.com/withstudiocms/studiocms/commit/87a5ed0fdf3a23b0c743f38a42a814b7d68f496d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement category and tag getters

- [#1134](https://github.com/withstudiocms/studiocms/pull/1134) [`3a27939`](https://github.com/withstudiocms/studiocms/commit/3a279390d2688d464fc5476fac0faf2bada2c1fd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks table types to better align with actual table schema

- [#1128](https://github.com/withstudiocms/studiocms/pull/1128) [`96c98c2`](https://github.com/withstudiocms/studiocms/commit/96c98c2e420bf8526611e674f1f58dd3fa2f33a3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweak categories and tag ID generation to try to solve ID issue with database entry, and enable categories and tag entry on pageData

- [#1140](https://github.com/withstudiocms/studiocms/pull/1140) [`fc33e3f`](https://github.com/withstudiocms/studiocms/commit/fc33e3fb2c3568331be89b43a3a892317834f43a) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency diff2html to ^3.4.55

- [#1157](https://github.com/withstudiocms/studiocms/pull/1157) [`f8a2d34`](https://github.com/withstudiocms/studiocms/commit/f8a2d342cc3c35bf4478bb523bf28d78dd2d0404) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add effect-language-service diagnostics scripts to all workspace packages

- [#1164](https://github.com/withstudiocms/studiocms/pull/1164) [`4ffae83`](https://github.com/withstudiocms/studiocms/commit/4ffae83377c75efe7c26c45d3cb360394fba5001) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements draft exclusion for GET.pageFolderTree(excludeDrafts?) in the SDK.

- [#1132](https://github.com/withstudiocms/studiocms/pull/1132) [`e1c3052`](https://github.com/withstudiocms/studiocms/commit/e1c30524e7fd6ed8f7b85874f049d36ffb50afc8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Ensures pageData does not surface any sensitive data

- [#1160](https://github.com/withstudiocms/studiocms/pull/1160) [`30de271`](https://github.com/withstudiocms/studiocms/commit/30de271f347a3a997669c8118006143148efb33a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactors code to handle Effect LSP diagnostic warnings and errors

- [#1163](https://github.com/withstudiocms/studiocms/pull/1163) [`cd865cf`](https://github.com/withstudiocms/studiocms/commit/cd865cf995c3b926900b347ee0782d9ccecc1d4f) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Removes deprecated hideDefaultIndex site config variable from SDK and updates all instances of usage in StudioCMS

  #### Breaking Change

  Note for anyone previously relying on this feature, it has now been completely removed. Users will need to adjust any code relying on this functionality.

- [#1099](https://github.com/withstudiocms/studiocms/pull/1099) [`359e655`](https://github.com/withstudiocms/studiocms/commit/359e65541206e5d10c3fef67666bc883f81e2f85) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduces StorageManager API to SDK and allow resolving image urls for site config and pagedata

- [#1153](https://github.com/withstudiocms/studiocms/pull/1153) [`0435b82`](https://github.com/withstudiocms/studiocms/commit/0435b82fbc40af767f065a990639b44cfefecf4d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Move custom StudioCMS migrations from `@withstudiocms/kysely` package to `@withstudiocms/sdk`

- Updated dependencies [[`25e6fc0`](https://github.com/withstudiocms/studiocms/commit/25e6fc0cca879e77c49c35da5e9a28e582957988), [`8e50cd0`](https://github.com/withstudiocms/studiocms/commit/8e50cd0885fa1e4664d457ff3fe4fa77b344ecc4), [`3a27939`](https://github.com/withstudiocms/studiocms/commit/3a279390d2688d464fc5476fac0faf2bada2c1fd), [`87d36ba`](https://github.com/withstudiocms/studiocms/commit/87d36ba83d24d83c7b2b17daa47231a63c225fa2), [`f8a2d34`](https://github.com/withstudiocms/studiocms/commit/f8a2d342cc3c35bf4478bb523bf28d78dd2d0404), [`e359a69`](https://github.com/withstudiocms/studiocms/commit/e359a69d2cad6db0b665908bdee67f02d418877a), [`b4d7879`](https://github.com/withstudiocms/studiocms/commit/b4d7879ae9ea93f199bcf187c8cd940efb405ad9), [`07095e6`](https://github.com/withstudiocms/studiocms/commit/07095e6ca5056f42ca642c6356b5196e9ccb4818), [`d59c4b0`](https://github.com/withstudiocms/studiocms/commit/d59c4b00d44b65bae84315d34fa3b721f9621136), [`cb8ffda`](https://github.com/withstudiocms/studiocms/commit/cb8ffda2d6fb31e3a754996b3e938a5c1b643af1), [`30de271`](https://github.com/withstudiocms/studiocms/commit/30de271f347a3a997669c8118006143148efb33a), [`0435b82`](https://github.com/withstudiocms/studiocms/commit/0435b82fbc40af767f065a990639b44cfefecf4d)]:
  - @withstudiocms/kysely@0.1.0-beta.2
  - @withstudiocms/effect@0.1.0-beta.8

## 0.1.0-beta.1

### Patch Changes

- [#963](https://github.com/withstudiocms/studiocms/pull/963) [`944e965`](https://github.com/withstudiocms/studiocms/commit/944e965e535f988ef2b9666d26739f65083bbc2d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Init new package

- [#1029](https://github.com/withstudiocms/studiocms/pull/1029) [`da369c7`](https://github.com/withstudiocms/studiocms/commit/da369c7bd8f40670cb56821d74686c79840f06e4) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Integrates new Kysely based SDK into StudioCMS

- [#1036](https://github.com/withstudiocms/studiocms/pull/1036) [`ddae77d`](https://github.com/withstudiocms/studiocms/commit/ddae77dbb22376803c4c166323dff161fe30d030) Thanks [@renovate](https://github.com/apps/renovate)! - lint

- [#1008](https://github.com/withstudiocms/studiocms/pull/1008) [`d857f5c`](https://github.com/withstudiocms/studiocms/commit/d857f5c7e76336f41541aeb0aae73f07f73d875c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweaks getFromNPM module to also provide last cache update. Also provides cache service from SDKCore

- [#1049](https://github.com/withstudiocms/studiocms/pull/1049) [`962d5ae`](https://github.com/withstudiocms/studiocms/commit/962d5aebb1c4e44d2fc4fe4d652300776ebaed35) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactors and cleans up Folder structure system to ensure urlRoute property on CombinedPageData return resolves correctly

- Updated dependencies [[`262442b`](https://github.com/withstudiocms/studiocms/commit/262442bab6538b91b9959449b4aa473d70e0126a), [`ee90810`](https://github.com/withstudiocms/studiocms/commit/ee9081053f808d4366a9c95e13539a5198b27bb5), [`a5b84c5`](https://github.com/withstudiocms/studiocms/commit/a5b84c52383bf299aa70c04b064850c7883b59b1), [`66480a1`](https://github.com/withstudiocms/studiocms/commit/66480a19943ca42b8471c76984321a9f6bd13d94), [`944e965`](https://github.com/withstudiocms/studiocms/commit/944e965e535f988ef2b9666d26739f65083bbc2d), [`9a8bfed`](https://github.com/withstudiocms/studiocms/commit/9a8bfeda461dbc7e3188222db3adeffca1c29f6a), [`ba79740`](https://github.com/withstudiocms/studiocms/commit/ba797403563b8fbd381e0fc28f4ccba0ec6432a6), [`3c54788`](https://github.com/withstudiocms/studiocms/commit/3c54788df0bd548f1e3489b7c7334279ee85d5cb), [`5cfd64b`](https://github.com/withstudiocms/studiocms/commit/5cfd64b743e6d716cffa05dffda6fb94d11e8251), [`1e1e6a1`](https://github.com/withstudiocms/studiocms/commit/1e1e6a1038de31bfe73070b4feb7163a3e7385a0), [`da369c7`](https://github.com/withstudiocms/studiocms/commit/da369c7bd8f40670cb56821d74686c79840f06e4), [`3fbc758`](https://github.com/withstudiocms/studiocms/commit/3fbc75812bbf4f27d8bb27a3c35c78d87616a2b6), [`ddae77d`](https://github.com/withstudiocms/studiocms/commit/ddae77dbb22376803c4c166323dff161fe30d030), [`c7c9b91`](https://github.com/withstudiocms/studiocms/commit/c7c9b918b426d253c4e33b5e8c7ead9c650339da), [`5756c15`](https://github.com/withstudiocms/studiocms/commit/5756c156d9adb4036029f930308606338fb39b6a), [`97c7847`](https://github.com/withstudiocms/studiocms/commit/97c7847c0cdd41998e0a6d8c61ab6f3c4ac4474e), [`675b7d5`](https://github.com/withstudiocms/studiocms/commit/675b7d5bbb2c40e6a204d3c7227812923e37289f), [`8da7850`](https://github.com/withstudiocms/studiocms/commit/8da7850d4cf4a2a7d1634081f92d5728ca5f0d9e)]:
  - @withstudiocms/kysely@0.1.0-beta.1
  - @withstudiocms/effect@0.1.0-beta.7
