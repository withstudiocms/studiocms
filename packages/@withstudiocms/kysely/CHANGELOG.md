# @withstudiocms/kysely

## 0.1.0

### Patch Changes

- [#1151](https://github.com/withstudiocms/studiocms/pull/1151) [`25e6fc0`](https://github.com/withstudiocms/studiocms/commit/25e6fc0cca879e77c49c35da5e9a28e582957988) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates table schemas from `@withstudiocms/kysely` to `@withstudiocms/sdk` package

- [#1134](https://github.com/withstudiocms/studiocms/pull/1134) [`3a27939`](https://github.com/withstudiocms/studiocms/commit/3a279390d2688d464fc5476fac0faf2bada2c1fd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks table types to better align with actual table schema

- [#1168](https://github.com/withstudiocms/studiocms/pull/1168) [`9bde767`](https://github.com/withstudiocms/studiocms/commit/9bde7670e3813828615354ec5f99b5188487eb48) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweak schema migration helpers

- [#1157](https://github.com/withstudiocms/studiocms/pull/1157) [`f8a2d34`](https://github.com/withstudiocms/studiocms/commit/f8a2d342cc3c35bf4478bb523bf28d78dd2d0404) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add effect-language-service diagnostics scripts to all workspace packages

- [#1145](https://github.com/withstudiocms/studiocms/pull/1145) [`e359a69`](https://github.com/withstudiocms/studiocms/commit/e359a69d2cad6db0b665908bdee67f02d418877a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements new unified migration/schema table types, to be used for automated migration management and type gen for planned Kysely astro integration, and expands migrator utilities to handle keeping migration schemas within the DB as a backup to relying on inline migration schemas.

- [#1146](https://github.com/withstudiocms/studiocms/pull/1146) [`b4d7879`](https://github.com/withstudiocms/studiocms/commit/b4d7879ae9ea93f199bcf187c8cd940efb405ad9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks and improves environment variable loading for dialect drivers, supporting both unprefixed and CMS\_-prefixed environment variables.

- [#1129](https://github.com/withstudiocms/studiocms/pull/1129) [`d59c4b0`](https://github.com/withstudiocms/studiocms/commit/d59c4b00d44b65bae84315d34fa3b721f9621136) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Replaced `@libsql/kysely-libsql` with `kysely-turso`

  #### BREAKING UPDATE

  All previous installs relying on `@libsql/kysely-libsql` should remove the old dependency and install the new `kysely-turso` dependency.

- [#1160](https://github.com/withstudiocms/studiocms/pull/1160) [`30de271`](https://github.com/withstudiocms/studiocms/commit/30de271f347a3a997669c8118006143148efb33a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactors code to handle Effect LSP diagnostic warnings and errors

- [#1153](https://github.com/withstudiocms/studiocms/pull/1153) [`0435b82`](https://github.com/withstudiocms/studiocms/commit/0435b82fbc40af767f065a990639b44cfefecf4d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Move custom StudioCMS migrations from `@withstudiocms/kysely` package to `@withstudiocms/sdk`

## 0.1.0-beta.2

### Patch Changes

- [#1151](https://github.com/withstudiocms/studiocms/pull/1151) [`25e6fc0`](https://github.com/withstudiocms/studiocms/commit/25e6fc0cca879e77c49c35da5e9a28e582957988) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates table schemas from `@withstudiocms/kysely` to `@withstudiocms/sdk` package

- [#1134](https://github.com/withstudiocms/studiocms/pull/1134) [`3a27939`](https://github.com/withstudiocms/studiocms/commit/3a279390d2688d464fc5476fac0faf2bada2c1fd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks table types to better align with actual table schema

- [#1157](https://github.com/withstudiocms/studiocms/pull/1157) [`f8a2d34`](https://github.com/withstudiocms/studiocms/commit/f8a2d342cc3c35bf4478bb523bf28d78dd2d0404) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add effect-language-service diagnostics scripts to all workspace packages

- [#1145](https://github.com/withstudiocms/studiocms/pull/1145) [`e359a69`](https://github.com/withstudiocms/studiocms/commit/e359a69d2cad6db0b665908bdee67f02d418877a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implements new unified migration/schema table types, to be used for automated migration management and type gen for planned Kysely astro integration, and expands migrator utilities to handle keeping migration schemas within the DB as a backup to relying on inline migration schemas.

- [#1146](https://github.com/withstudiocms/studiocms/pull/1146) [`b4d7879`](https://github.com/withstudiocms/studiocms/commit/b4d7879ae9ea93f199bcf187c8cd940efb405ad9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Reworks and improves environment variable loading for dialect drivers, supporting both unprefixed and CMS\_-prefixed environment variables.

- [#1085](https://github.com/withstudiocms/studiocms/pull/1085) [`07095e6`](https://github.com/withstudiocms/studiocms/commit/07095e6ca5056f42ca642c6356b5196e9ccb4818) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Adds new migration for Storage manager url mappings

- [#1129](https://github.com/withstudiocms/studiocms/pull/1129) [`d59c4b0`](https://github.com/withstudiocms/studiocms/commit/d59c4b00d44b65bae84315d34fa3b721f9621136) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Replaced `@libsql/kysely-libsql` with `kysely-turso`

  #### BREAKING UPDATE

  All previous installs relying on `@libsql/kysely-libsql` should remove the old dependency and install the new `kysely-turso` dependency.

- [#1160](https://github.com/withstudiocms/studiocms/pull/1160) [`30de271`](https://github.com/withstudiocms/studiocms/commit/30de271f347a3a997669c8118006143148efb33a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactors code to handle Effect LSP diagnostic warnings and errors

- [#1153](https://github.com/withstudiocms/studiocms/pull/1153) [`0435b82`](https://github.com/withstudiocms/studiocms/commit/0435b82fbc40af767f065a990639b44cfefecf4d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Move custom StudioCMS migrations from `@withstudiocms/kysely` package to `@withstudiocms/sdk`

## 0.1.0-beta.1

### Patch Changes

- [#1033](https://github.com/withstudiocms/studiocms/pull/1033) [`262442b`](https://github.com/withstudiocms/studiocms/commit/262442bab6538b91b9959449b4aa473d70e0126a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Updates migration handling

- [#1030](https://github.com/withstudiocms/studiocms/pull/1030) [`66480a1`](https://github.com/withstudiocms/studiocms/commit/66480a19943ca42b8471c76984321a9f6bd13d94) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduces new plugin helpers for DB interactions

- [#963](https://github.com/withstudiocms/studiocms/pull/963) [`944e965`](https://github.com/withstudiocms/studiocms/commit/944e965e535f988ef2b9666d26739f65083bbc2d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Init new package

- [#1007](https://github.com/withstudiocms/studiocms/pull/1007) [`5cfd64b`](https://github.com/withstudiocms/studiocms/commit/5cfd64b743e6d716cffa05dffda6fb94d11e8251) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Improves testing

- [#1029](https://github.com/withstudiocms/studiocms/pull/1029) [`da369c7`](https://github.com/withstudiocms/studiocms/commit/da369c7bd8f40670cb56821d74686c79840f06e4) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Integrates new Kysely based SDK into StudioCMS

- [#1065](https://github.com/withstudiocms/studiocms/pull/1065) [`3fbc758`](https://github.com/withstudiocms/studiocms/commit/3fbc75812bbf4f27d8bb27a3c35c78d87616a2b6) Thanks [@renovate](https://github.com/apps/renovate)! - chore(deps): update dependency tsx to ^4.21.0

- [#1036](https://github.com/withstudiocms/studiocms/pull/1036) [`ddae77d`](https://github.com/withstudiocms/studiocms/commit/ddae77dbb22376803c4c166323dff161fe30d030) Thanks [@renovate](https://github.com/apps/renovate)! - lint

- [#1054](https://github.com/withstudiocms/studiocms/pull/1054) [`c7c9b91`](https://github.com/withstudiocms/studiocms/commit/c7c9b918b426d253c4e33b5e8c7ead9c650339da) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fixes type gen issue

- [#1024](https://github.com/withstudiocms/studiocms/pull/1024) [`5756c15`](https://github.com/withstudiocms/studiocms/commit/5756c156d9adb4036029f930308606338fb39b6a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Tweak logging to be debug logging internally

- [#992](https://github.com/withstudiocms/studiocms/pull/992) [`8da7850`](https://github.com/withstudiocms/studiocms/commit/8da7850d4cf4a2a7d1634081f92d5728ca5f0d9e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Simplifies migration system and client typing
