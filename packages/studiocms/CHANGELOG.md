# studiocms

## 0.1.0-beta.23

### Patch Changes

- [#660](https://github.com/withstudiocms/studiocms/pull/660) [`3a74068`](https://github.com/withstudiocms/studiocms/commit/3a74068be3bd228c36d62d263be1b82159d885fb) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate oAuth providers into dedicated StudioCMS provider plugins, `@studiocms/discord`, `@studiocms/github`, `@studiocms/google` and `@studiocms/auth0`. Providers must now be installed separately from StudioCMS itself.

- [#660](https://github.com/withstudiocms/studiocms/pull/660) [`3a74068`](https://github.com/withstudiocms/studiocms/commit/3a74068be3bd228c36d62d263be1b82159d885fb) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix sdk: Correct issue where the CMSSiteConfigId is undefined during initialization.

- [#658](https://github.com/withstudiocms/studiocms/pull/658) [`5c02ad4`](https://github.com/withstudiocms/studiocms/commit/5c02ad4b62e47455d20e5a380ca59d6b070c7e41) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - tweak user quick tools widget and endpoint to prevent an actual 400 error on the user browser

## 0.1.0-beta.22

### Patch Changes

- [#649](https://github.com/withstudiocms/studiocms/pull/649) [`336397f`](https://github.com/withstudiocms/studiocms/commit/336397f31a63bdb05a17a6a7e9a0ab22601bbb61) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Remove deprecated `@astrojs/web-vitals` support in favor of new `@studiocms/web-vitals` package

- [#644](https://github.com/withstudiocms/studiocms/pull/644) [`83a47ff`](https://github.com/withstudiocms/studiocms/commit/83a47ff1912f30bae20461b2bfd994efe3f35749) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add support for the SDK folder getter to get by name or ID instead of just ID, and add jsdoc comments to missing functions for the SDK

- [#629](https://github.com/withstudiocms/studiocms/pull/629) [`356791d`](https://github.com/withstudiocms/studiocms/commit/356791d80aa8a33cbb77e2c83ca8fc70eaf3b5dd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor component registry into new custom handler for reading component props during initialization for usage within StudioCMS Dashboard editors

  #### Breaking Changes

  - `studiocms:component-proxy` has been replaced by `studiocms:component-registry`
  - Added `studiocms:component-registry/runtime` virtual module which exports types, and the following helpers, `getRegistryComponents` and `getRendererComponents` used for getting Components with props, and the renderer components respectively.
  - `importComponentKeys` has been carried over but deprecated in favor for the new `getRendererComponents` function.

- [#642](https://github.com/withstudiocms/studiocms/pull/642) [`e9be97d`](https://github.com/withstudiocms/studiocms/commit/e9be97dabcd8e479f929a43919332e5deb187900) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix: Correct exports for components, layouts, and add export for styles

- [#650](https://github.com/withstudiocms/studiocms/pull/650) [`3e7f7ca`](https://github.com/withstudiocms/studiocms/commit/3e7f7ca6ea2a304fe66eac95496542cc50169eb2) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update various deps and lint repo with updated biome version

- [#643](https://github.com/withstudiocms/studiocms/pull/643) [`9cfba9a`](https://github.com/withstudiocms/studiocms/commit/9cfba9ad57f8fb1b2a10081fbe5f9dfc26bed57d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Moved MD and HTML pagetypes into their own plugins

- [#656](https://github.com/withstudiocms/studiocms/pull/656) [`3233abe`](https://github.com/withstudiocms/studiocms/commit/3233abe727ac9ba6f1886ef5a931db81f0da4326) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update dependencies

- [#637](https://github.com/withstudiocms/studiocms/pull/637) [`7511f47`](https://github.com/withstudiocms/studiocms/commit/7511f47042104bed83f985c336c7d62cc1fd3b2f) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Remove Deprecated SDK functions and refactor SDK to make it easier to modify/read

- [#643](https://github.com/withstudiocms/studiocms/pull/643) [`9cfba9a`](https://github.com/withstudiocms/studiocms/commit/9cfba9ad57f8fb1b2a10081fbe5f9dfc26bed57d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - All internal base included pagetypes have been removed, allowing even more flexibility when it comes to how studiocms works for the user. This change also means that you will be required to install at least one rendering plugin for studiocms

- [#640](https://github.com/withstudiocms/studiocms/pull/640) [`fe3fa26`](https://github.com/withstudiocms/studiocms/commit/fe3fa262b80a17ea2d89d8f09e4c3ac97f64ca5f) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Remove previously deprected functions and old hashing system

- [#635](https://github.com/withstudiocms/studiocms/pull/635) [`54da8e7`](https://github.com/withstudiocms/studiocms/commit/54da8e7ff080f44a02ca8139c8ddade37f1d32f4) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor oAuth endpoints into two dynamic endpoints with a provider param in the route and cleanup all auth endpoints code.

- [#657](https://github.com/withstudiocms/studiocms/pull/657) [`a05bb16`](https://github.com/withstudiocms/studiocms/commit/a05bb16d3dd0d1a429558b4dce316ad7fb80b049) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate to using new config utils package that contains generic config helpers instead of relying on specific ones built-in to studiocms

- Updated dependencies [[`a05bb16`](https://github.com/withstudiocms/studiocms/commit/a05bb16d3dd0d1a429558b4dce316ad7fb80b049)]:
  - @withstudiocms/config-utils@0.1.0-beta.1

## 0.1.0-beta.21

### Patch Changes

- [#634](https://github.com/withstudiocms/studiocms/pull/634) [`d1fa826`](https://github.com/withstudiocms/studiocms/commit/d1fa8267eb7ae3336adffa35c7a5688a29986818) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix: Implement fixes for First-time-setup, auth API routes and css for font, and markdown pageType config

## 0.1.0-beta.20

### Patch Changes

- [#631](https://github.com/withstudiocms/studiocms/pull/631) [`ca4a3eb`](https://github.com/withstudiocms/studiocms/commit/ca4a3eb4bb4c810551385471cf071bc0f9cd80eb) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix: Remove need for unavailable middleware for first time setup pages

## 0.1.0-beta.19

### Patch Changes

- [#617](https://github.com/withstudiocms/studiocms/pull/617) [`447a320`](https://github.com/withstudiocms/studiocms/commit/447a3201b9ea1b942c71979511cb8b3edf822e39) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate Image Service system into plugin system. This change now means that setting an imageService requires a ImageService plugin to be added to plugin array, as well as setting the `preferredImageService` in the features setting on the StudioCMS config.

- [#607](https://github.com/withstudiocms/studiocms/pull/607) [`d3f0228`](https://github.com/withstudiocms/studiocms/commit/d3f0228d2f20a346387fa1267db35fd5b2f0649a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate FirstTimeSetup, Mailer, RestAPI, and sdk api routes to effect.

- [#610](https://github.com/withstudiocms/studiocms/pull/610) [`198d14a`](https://github.com/withstudiocms/studiocms/commit/198d14ad038b208a73c10312b73dea253d21efb0) Thanks [@dreyfus92](https://github.com/dreyfus92)! - Remove Google Fonts dependency and implement local font system to resolve network blocking issues

- [#627](https://github.com/withstudiocms/studiocms/pull/627) [`cdb9fe4`](https://github.com/withstudiocms/studiocms/commit/cdb9fe4ff3378013bba950f56f566afd7d23e744) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix login api route and related effects

- [#608](https://github.com/withstudiocms/studiocms/pull/608) [`33266b4`](https://github.com/withstudiocms/studiocms/commit/33266b443e730db93f7a63cb3f9325d4cc0548db) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update dependencies

  ### Breaking: StudioCMS now supports only Node 20 and higher

- [#590](https://github.com/withstudiocms/studiocms/pull/590) [`231cf43`](https://github.com/withstudiocms/studiocms/commit/231cf438ae7465805ce456d198e170d17331e911) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor lib/mailer to Utilize Effect-TS

- [#625](https://github.com/withstudiocms/studiocms/pull/625) [`26523a0`](https://github.com/withstudiocms/studiocms/commit/26523a0d0762c67e80ed9d02595a6e160ef345cf) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Move Cloudinary image service to its own package

- [#625](https://github.com/withstudiocms/studiocms/pull/625) [`26523a0`](https://github.com/withstudiocms/studiocms/commit/26523a0d0762c67e80ed9d02595a6e160ef345cf) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update Nanostores to v1

- [#613](https://github.com/withstudiocms/studiocms/pull/613) [`d1c2536`](https://github.com/withstudiocms/studiocms/commit/d1c253631d665f7abff631bef02c69a038e9d1a2) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate auth api routes to use effect and cleanup API endpoint folder structure.

- [#606](https://github.com/withstudiocms/studiocms/pull/606) [`78f3cfc`](https://github.com/withstudiocms/studiocms/commit/78f3cfcc614bb9a74818f673c9d24c2020ed5a4a) Thanks [@aliozinan](https://github.com/aliozinan)! - Removes duplicated if condition in [plugin].ts

- [#620](https://github.com/withstudiocms/studiocms/pull/620) [`4343719`](https://github.com/withstudiocms/studiocms/commit/43437190e28d1f5efd85470d6bddeb7219c79479) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update deps, and Migrate CLI to Effect based code

- [#602](https://github.com/withstudiocms/studiocms/pull/602) [`f8c70bc`](https://github.com/withstudiocms/studiocms/commit/f8c70bc4280c617929c4500002c5cbe5ef7c2837) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - More Effect conversion of API Routes and internal functions

- [#598](https://github.com/withstudiocms/studiocms/pull/598) [`a3c2c53`](https://github.com/withstudiocms/studiocms/commit/a3c2c5376073e95a88d22dc290b56705be0907a3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor lib/notifier to Utilize Effect-TS

- [#589](https://github.com/withstudiocms/studiocms/pull/589) [`688dd08`](https://github.com/withstudiocms/studiocms/commit/688dd08b1062b47132d90d39c6a5a946f40bb8b6) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor lib/auth to Utilize Effect-TS

- [#601](https://github.com/withstudiocms/studiocms/pull/601) [`f13e396`](https://github.com/withstudiocms/studiocms/commit/f13e396308426df2b8f08f1502f3c43c20c7241e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor middleware, add new effect utils, and effect cleanup

  - Middleware files are now Effects.
  - Updated all current effects to Effect Services, and created new effect utils in `lib/effects/`
    - New SMTP Effect for wrapping `nodemailer`
    - New Logger utils for Effect
    - Updated lib/auth effects
    - Updated lib/mailer effect
    - Updated lib/notifier effect

- [#614](https://github.com/withstudiocms/studiocms/pull/614) [`88e624d`](https://github.com/withstudiocms/studiocms/commit/88e624df79ac3d2a11c9bbe29d31495ab7ef9a7e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor code and config structure.

  #### BREAKING CHANGES

  StudioCMS has a new configuration structure. Please verify your configuration after updating. Configurations can now also be converted from `studiocms.config.js` to `studiocms.config.ts` and they will work while being fully typed!

- [#625](https://github.com/withstudiocms/studiocms/pull/625) [`26523a0`](https://github.com/withstudiocms/studiocms/commit/26523a0d0762c67e80ed9d02595a6e160ef345cf) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Code cleanup/organization

- [#616](https://github.com/withstudiocms/studiocms/pull/616) [`e3e70d5`](https://github.com/withstudiocms/studiocms/commit/e3e70d531b5d3009f284e168762b5dfb4c81d932) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update dashboard pages to utilize new Effect system

- [#615](https://github.com/withstudiocms/studiocms/pull/615) [`cfea3fc`](https://github.com/withstudiocms/studiocms/commit/cfea3fc59be311f38ecaa49d3594827252fe20fd) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrate dashboard api routes to Effect, as well as create unified helpers for Options and All endpoint responses

- [#599](https://github.com/withstudiocms/studiocms/pull/599) [`c71b5fc`](https://github.com/withstudiocms/studiocms/commit/c71b5fcf98821a73333da21c7bfd92a244febb22) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #599)

- [#600](https://github.com/withstudiocms/studiocms/pull/600) [`599aaf7`](https://github.com/withstudiocms/studiocms/commit/599aaf7d6760fa5c71913f541b11b67338354e0b) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor sdk to Utilize Effect-TS, This change also merges the normal and the cached SDK functionalities to simplify the overall SDK structure. The old functionality is now deprecated.

## 0.1.0-beta.18

### Patch Changes

- [#585](https://github.com/withstudiocms/studiocms/pull/585) [`3226347`](https://github.com/withstudiocms/studiocms/commit/32263470412a3196f1ed9dca6bd5cfb8fe5f258a) Thanks [@renovate](https://github.com/apps/renovate)! - fix(deps): update dependency nodemailer to v7

- [#588](https://github.com/withstudiocms/studiocms/pull/588) [`4b6719b`](https://github.com/withstudiocms/studiocms/commit/4b6719b27fbe696c2568ba4ba10600cda23790a8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix gen-jwt CLI command

- [#583](https://github.com/withstudiocms/studiocms/pull/583) [`3198db5`](https://github.com/withstudiocms/studiocms/commit/3198db594e22d15e05300c29c12294c2182f10c0) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement new StudioCMS hook-based plugin system

## 0.1.0-beta.17

### Patch Changes

- [#576](https://github.com/withstudiocms/studiocms/pull/576) [`a09257f`](https://github.com/withstudiocms/studiocms/commit/a09257ffe9fca4226af031113e427f472d6057db) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - replace lodash with deepmerge-ts

- [#573](https://github.com/withstudiocms/studiocms/pull/573) [`77bd274`](https://github.com/withstudiocms/studiocms/commit/77bd274b33801e06946b3f8bcdb32ed7e950ae78) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update CLI hashing utils

- [#581](https://github.com/withstudiocms/studiocms/pull/581) [`63eb2dd`](https://github.com/withstudiocms/studiocms/commit/63eb2dd922eee45542572e93a09bb1be49d2c9c3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement new feedback system in the dashboard

- [#580](https://github.com/withstudiocms/studiocms/pull/580) [`1662095`](https://github.com/withstudiocms/studiocms/commit/166209597fcd22b887dac9b9612e4f85e1ecc91a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Optimize promises in middleware and update how permission levels are being processed

- [#577](https://github.com/withstudiocms/studiocms/pull/577) [`e609592`](https://github.com/withstudiocms/studiocms/commit/e6095923d5d8b97e92854062e03e31785c74e542) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix Astro Fonts

- [#575](https://github.com/withstudiocms/studiocms/pull/575) [`bd3b571`](https://github.com/withstudiocms/studiocms/commit/bd3b5714645a52b9f353754463ab64d59590a4be) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update keyfile path detection

## 0.1.0-beta.16

### Patch Changes

- [#563](https://github.com/withstudiocms/studiocms/pull/563) [`1256340`](https://github.com/withstudiocms/studiocms/commit/1256340864ede18cf1e066011b87e13cc16d1c9e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement new CLI functionality to generate JWT tokens usable for custom sqld servers

- [#571](https://github.com/withstudiocms/studiocms/pull/571) [`ec92a2b`](https://github.com/withstudiocms/studiocms/commit/ec92a2b52588c0db6feca08bc2792cd7701db79e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update password system

- [#557](https://github.com/withstudiocms/studiocms/pull/557) [`0536040`](https://github.com/withstudiocms/studiocms/commit/05360407c40674fd6045468a322f066a7284c6c9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement new CLI command for StudioCMS

  There is now a `studiocms add <plugin...>` command that allows you to add plugins to studiocms easily!

- [#569](https://github.com/withstudiocms/studiocms/pull/569) [`e6276f3`](https://github.com/withstudiocms/studiocms/commit/e6276f3389225109aeda015f9ed77b99a69b3239) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix editing users for cli

- [#566](https://github.com/withstudiocms/studiocms/pull/566) [`1b63cc5`](https://github.com/withstudiocms/studiocms/commit/1b63cc5ad70b50c8c7ff8679bd0e390651b1c2b3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - migrate cli to utilize @withstudiocms/cli-kit

- [#568](https://github.com/withstudiocms/studiocms/pull/568) [`1f5c3d7`](https://github.com/withstudiocms/studiocms/commit/1f5c3d7f3b9ae9094b06cd3092c04da9af0b5106) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update to Astro v5.7 and Implement new Astro Fonts feature

## 0.1.0-beta.15

### Patch Changes

- [#553](https://github.com/withstudiocms/studiocms/pull/553) [`ae8cdfc`](https://github.com/withstudiocms/studiocms/commit/ae8cdfcb7f02e4f0d520fd91d0a295a22f05f421) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #553)

- [#544](https://github.com/withstudiocms/studiocms/pull/544) [`83a05db`](https://github.com/withstudiocms/studiocms/commit/83a05db9d05cd88e2a49bc31f5bee20de8a39cd8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Optimized data processing with concurrent operations, resulting in faster content rendering and improved responsiveness.

- [#510](https://github.com/withstudiocms/studiocms/pull/510) [`6944793`](https://github.com/withstudiocms/studiocms/commit/69447937e7379242749a321d71ddd924302560dc) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #510)

- [#531](https://github.com/withstudiocms/studiocms/pull/531) [`ec4530b`](https://github.com/withstudiocms/studiocms/commit/ec4530bac62e192a4abc34826c2a67c57290de2e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix bug with page creation and cache

- [#522](https://github.com/withstudiocms/studiocms/pull/522) [`de1dbec`](https://github.com/withstudiocms/studiocms/commit/de1dbec5590518753aa3fee6db6e6cd060327fa2) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix SDK JWT generation and verification

- [#512](https://github.com/withstudiocms/studiocms/pull/512) [`cd10407`](https://github.com/withstudiocms/studiocms/commit/cd1040779926a55db63ceb6ac1b9ddacb23330a8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update to utilize new `@withstudiocms/buildkit` for build and dev

- [#552](https://github.com/withstudiocms/studiocms/pull/552) [`1ee31e6`](https://github.com/withstudiocms/studiocms/commit/1ee31e6840b05a1619b2959572d484cff8f0116d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - tweak sidebar css

- [#556](https://github.com/withstudiocms/studiocms/pull/556) [`13f2d99`](https://github.com/withstudiocms/studiocms/commit/13f2d994956488daa7fe5bc9e1597b82cdb165c7) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - update script to send proper response

- [#528](https://github.com/withstudiocms/studiocms/pull/528) [`d3674d6`](https://github.com/withstudiocms/studiocms/commit/d3674d618141924e88568bb7540debd97f3eaa77) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #528)

- [#511](https://github.com/withstudiocms/studiocms/pull/511) [`c3d0b1e`](https://github.com/withstudiocms/studiocms/commit/c3d0b1e2d083057fc9ec2775dabd029b9dfd7e72) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update default `en-us` language code to `en`

- [#549](https://github.com/withstudiocms/studiocms/pull/549) [`9199097`](https://github.com/withstudiocms/studiocms/commit/9199097fc20ca40b4716e57230fdc585af542167) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update dependencies (Support Astro v5.6)

- [#539](https://github.com/withstudiocms/studiocms/pull/539) [`a4ab614`](https://github.com/withstudiocms/studiocms/commit/a4ab614954e05d541a8e09178370669a8e501212) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - feat(sdk): add pagination support to folderPages and getAllPages functions

- [#536](https://github.com/withstudiocms/studiocms/pull/536) [`301ab9f`](https://github.com/withstudiocms/studiocms/commit/301ab9f1ef8da10001536de1634d330400a4fea3) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - bugfix: Verify user has the correct permissions before allowing user modification.

- [#543](https://github.com/withstudiocms/studiocms/pull/543) [`a7dc2ad`](https://github.com/withstudiocms/studiocms/commit/a7dc2ad764fb73432c7a6c00986d7f353a871f4b) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #543)

- [#514](https://github.com/withstudiocms/studiocms/pull/514) [`0d0fbd6`](https://github.com/withstudiocms/studiocms/commit/0d0fbd6c13fc3e836bee7724d95ef3a63ce3f714) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix webvitals plugin translations for dashboard page

- [#527](https://github.com/withstudiocms/studiocms/pull/527) [`c900ab8`](https://github.com/withstudiocms/studiocms/commit/c900ab85a5c74e52865e7086a5e851d7f1836e4c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix(dashboard): fix css for two dashboard grid components that in some browsers would show the wrong color

- [#529](https://github.com/withstudiocms/studiocms/pull/529) [`089dcc3`](https://github.com/withstudiocms/studiocms/commit/089dcc30df37ccecb5903ebeedf81844b34be8f7) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Add the ability to both update the Avatar URL, and sync with Libravatar Avatar service.

- [#537](https://github.com/withstudiocms/studiocms/pull/537) [`97bbfc8`](https://github.com/withstudiocms/studiocms/commit/97bbfc8263152c774d7bce20005070273789ca3c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix: components in componentRegistry can now have names such as `test-comp`

- [#530](https://github.com/withstudiocms/studiocms/pull/530) [`7ed3f39`](https://github.com/withstudiocms/studiocms/commit/7ed3f391bc6a67a6891f7a4cf7c3e1ecf171aff6) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #530)

- [#517](https://github.com/withstudiocms/studiocms/pull/517) [`b710b58`](https://github.com/withstudiocms/studiocms/commit/b710b5859625597b14c30fd4c386fcc3d88dae71) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement CLI utils for user management

- [#538](https://github.com/withstudiocms/studiocms/pull/538) [`6b83369`](https://github.com/withstudiocms/studiocms/commit/6b8336988c00c8cfe4254c0e454d6ddbc9a145c1) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - refactor createPage logic to allow for draft pages and published pages correctly

- [#525](https://github.com/withstudiocms/studiocms/pull/525) [`ea82076`](https://github.com/withstudiocms/studiocms/commit/ea82076651a09cdebb13082c627074909b919f44) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update SDK to allow getting pages by folder, add support to only return the page metadata, and add author and contributor data to page metadata.

- [#524](https://github.com/withstudiocms/studiocms/pull/524) [`e2aa9d3`](https://github.com/withstudiocms/studiocms/commit/e2aa9d3a56985403cd4810e47ce823def2ad86eb) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix version cache generation

- [#545](https://github.com/withstudiocms/studiocms/pull/545) [`10d64cf`](https://github.com/withstudiocms/studiocms/commit/10d64cfa7fdd6f85fd6af099081675acdea58a92) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - More route optimizations, moving variables that are called on multiple pages/endpoints to middleware

## 0.1.0-beta.14

### Patch Changes

- [#505](https://github.com/withstudiocms/studiocms/pull/505) [`ae5176d`](https://github.com/withstudiocms/studiocms/commit/ae5176dd683c0abc5b997c2e5f5935df5eb7d33e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor StudioCMS and remove dependencies,

  - `package-json` is now removed, as we have an included function to get the latest version from npm directly. (much simpler interface)
  - Move functionality from `@matthiesenxyz/integrationUtils` for checkIfUnsafe() util, since that is the only util we are using, into StudioCMS. removing the need for this dep all together

- [#500](https://github.com/withstudiocms/studiocms/pull/500) [`1e61e13`](https://github.com/withstudiocms/studiocms/commit/1e61e13c2d7d02a4d00f733a268884904a644e37) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #500)

- [#507](https://github.com/withstudiocms/studiocms/pull/507) [`4d42b42`](https://github.com/withstudiocms/studiocms/commit/4d42b4289ce43f2812fbb80913485db8a300163e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor SDK and page scripts

  - SDK cache is now busted when it should be
  - Content management page sidebar now refreshes
  - You can now hide the default index in the siteConfig on the dashboard

  ### NOTICE (non-breaking schema update)

  - You will need to push the new schema `astro db push --remote`

- [#503](https://github.com/withstudiocms/studiocms/pull/503) [`55663b2`](https://github.com/withstudiocms/studiocms/commit/55663b243fd516ed77a90987b9768f82184c180b) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #503)

- [#506](https://github.com/withstudiocms/studiocms/pull/506) [`b26cfb5`](https://github.com/withstudiocms/studiocms/commit/b26cfb58f19c1b571a1395a6bc6c6d3963e0a19a) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Export runtime functions in package.json for plugins to use.

- [#496](https://github.com/withstudiocms/studiocms/pull/496) [`f45607e`](https://github.com/withstudiocms/studiocms/commit/f45607e2efc61242db96d5cc9a408e9af27d7650) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update responses for username or password when invalid

- [#492](https://github.com/withstudiocms/studiocms/pull/492) [`7d14e58`](https://github.com/withstudiocms/studiocms/commit/7d14e583406c2afcbd398d4c7da2187ba79a840c) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #492)

- [#495](https://github.com/withstudiocms/studiocms/pull/495) [`62ee6fc`](https://github.com/withstudiocms/studiocms/commit/62ee6fc4a3afc7a57470e3a72d8ec61785d39a18) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #495)

- [#504](https://github.com/withstudiocms/studiocms/pull/504) [`055824c`](https://github.com/withstudiocms/studiocms/commit/055824c6a5a52b74ed169050745328bdac07e6bb) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduce new JWT Token system to reduce dependencies

## 0.1.0-beta.13

### Patch Changes

- [#484](https://github.com/withstudiocms/studiocms/pull/484) [`48630ef`](https://github.com/withstudiocms/studiocms/commit/48630ef21bac514baa23aeb07d4fbf6fd09fb909) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #484)

- [#483](https://github.com/withstudiocms/studiocms/pull/483) [`3612916`](https://github.com/withstudiocms/studiocms/commit/3612916cf393488e4ba850312cc0a8ce27fd9122) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix Missing CSS on DB start pages for the code blocks

- [#489](https://github.com/withstudiocms/studiocms/pull/489) [`77f89d6`](https://github.com/withstudiocms/studiocms/commit/77f89d6ecec0f06ffdb03bb8b86e99880345ee48) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update dependencies

- [#490](https://github.com/withstudiocms/studiocms/pull/490) [`5780894`](https://github.com/withstudiocms/studiocms/commit/578089449210d017748df5fd27b34569a6899ce0) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #490)

- [#476](https://github.com/withstudiocms/studiocms/pull/476) [`a430661`](https://github.com/withstudiocms/studiocms/commit/a4306618aeb3479f9d7b074637a54dc65798fe78) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - fix(auth): Re-enable the verification for usernames and passwords to ensure data safety

- [#474](https://github.com/withstudiocms/studiocms/pull/474) [`4fc5d6b`](https://github.com/withstudiocms/studiocms/commit/4fc5d6b9528968d7681dbf2f549e844989e10eb5) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor internal integration logic to cleanup old logic and simplify main integration

- [#480](https://github.com/withstudiocms/studiocms/pull/480) [`3f8b220`](https://github.com/withstudiocms/studiocms/commit/3f8b220a118b7829d9680b579fc50dd379d25c4b) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - NEW: HTML pageType available for pages, build HTML pages with the new SunEditor HTML builder.

- [#488](https://github.com/withstudiocms/studiocms/pull/488) [`501d11c`](https://github.com/withstudiocms/studiocms/commit/501d11cb41dd89e0280eecba9db57a49fce260a5) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #488)

- [#485](https://github.com/withstudiocms/studiocms/pull/485) [`ab1714c`](https://github.com/withstudiocms/studiocms/commit/ab1714ce7d89560c545b42601c888a004941f992) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update Diff page

  - Update pageMetaData section to use disabled inputs to display previous/current data
  - Implement diff endpoint for reverting changes
  - Add interactive buttons for reverting changes
  - Add helpful information to the top section to display info about the diff

- [#477](https://github.com/withstudiocms/studiocms/pull/477) [`0901215`](https://github.com/withstudiocms/studiocms/commit/0901215cf33b7e0283c1b31265038fd15efd7dfb) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Remove old `testingAndDemoMode` developer option and add new `demoMode` option with a simple interface

  Demo mode can either be `false` or an object with the following type `{ username: string; password: string; }`. This will allow you to create demo user credentials that are public.

  Please note, this does not prevent changes and resetting the DB is up to the developer to configure on their own. (a github action that clears the tables and adds the desired values back on a schedule is one idea for this.)

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

- [#481](https://github.com/withstudiocms/studiocms/pull/481) [`dae7795`](https://github.com/withstudiocms/studiocms/commit/dae77957cac866e47d09997ac6c990e3326459ea) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #481)

- [#473](https://github.com/withstudiocms/studiocms/pull/473) [`ddc7eb8`](https://github.com/withstudiocms/studiocms/commit/ddc7eb8a9a351d851bb5820dcb2297dc4de793d9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix ambient types, and remove now unused stub files and type injection

  Consolidate all virtual types into a single file,

  - Previous exports such as `studiocms/v/core.d.ts` are now all under `studiocms/v/types`

- [#479](https://github.com/withstudiocms/studiocms/pull/479) [`4880ce8`](https://github.com/withstudiocms/studiocms/commit/4880ce877a0c4bea3dcbe1c1565a78ab56603afc) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Remove unused dependencies and references

- [#471](https://github.com/withstudiocms/studiocms/pull/471) [`9512aac`](https://github.com/withstudiocms/studiocms/commit/9512aac4a928423caf91cbaa1c89a29e9d40a731) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update Arctic to v3.5.0 and implement new required code verifier for auth0 and discord

- [#486](https://github.com/withstudiocms/studiocms/pull/486) [`ddee17d`](https://github.com/withstudiocms/studiocms/commit/ddee17de1be97d05345caa4008de95c36e30333d) Thanks [@studiocms-no-reply](https://github.com/studiocms-no-reply)! - Translation Updated (PR: #486)

- [#473](https://github.com/withstudiocms/studiocms/pull/473) [`ddc7eb8`](https://github.com/withstudiocms/studiocms/commit/ddc7eb8a9a351d851bb5820dcb2297dc4de793d9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update READMEs

## 0.1.0-beta.12

### Patch Changes

- [#465](https://github.com/withstudiocms/studiocms/pull/465) [`66ca9c7`](https://github.com/withstudiocms/studiocms/commit/66ca9c7a5209edf2eb8e4a6336cb0db24936179e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Revert the SDK back to `@astrojs/db` instead of `drizzle-orm` as `drizzle-orm` was not causing our issues

- [#456](https://github.com/withstudiocms/studiocms/pull/456) [`d66d081`](https://github.com/withstudiocms/studiocms/commit/d66d081748399e30d3940b6d1447f576d2e14c1c) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Expand SDK virtual cache system to allow more functionality either with the cache or passthrough to the normal SDK

- [#455](https://github.com/withstudiocms/studiocms/pull/455) [`a23a95e`](https://github.com/withstudiocms/studiocms/commit/a23a95e5bf8209d456fc02468622840aa2167d40) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement runtime logger on all API routes

- [#454](https://github.com/withstudiocms/studiocms/pull/454) [`1021093`](https://github.com/withstudiocms/studiocms/commit/1021093c253085dbe9dadf6a37913dc57654409e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Refactor pageType api endpoint management to prevent errors when using virtual modules within a APIRoute

- [#458](https://github.com/withstudiocms/studiocms/pull/458) [`d445247`](https://github.com/withstudiocms/studiocms/commit/d4452478a83e59218f228c2d30a58447295841c4) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Hide and protect the deleted "Ghost" user from the dashboard

- [#461](https://github.com/withstudiocms/studiocms/pull/461) [`49171af`](https://github.com/withstudiocms/studiocms/commit/49171af77f341b458cbb5155f656d9e7e1061a05) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement forgot password functionality if mailer is enabled

- [#466](https://github.com/withstudiocms/studiocms/pull/466) [`feb37bf`](https://github.com/withstudiocms/studiocms/commit/feb37bf059aea1280eb466b4a1ff3807ce4518f8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Move routes to their ts variant to resolve weird bundling issue with astro

- [#464](https://github.com/withstudiocms/studiocms/pull/464) [`c77c4c7`](https://github.com/withstudiocms/studiocms/commit/c77c4c712982c3debdf0c34a2a635fb22c2d85d7) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Internal package organization, no user facing changes

- [#459](https://github.com/withstudiocms/studiocms/pull/459) [`c914ec4`](https://github.com/withstudiocms/studiocms/commit/c914ec4e10f7b33503f958d5c06fba8f1bd9fd1d) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Extend mailer functionality into the auth system for optional Email verification

- [#460](https://github.com/withstudiocms/studiocms/pull/460) [`0b4c1fe`](https://github.com/withstudiocms/studiocms/commit/0b4c1fef2f69c2b593a3c82d7eb4036aabb4efd9) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement basic email notifier system for User and Admin notifications

- [#457](https://github.com/withstudiocms/studiocms/pull/457) [`1421e4c`](https://github.com/withstudiocms/studiocms/commit/1421e4c79907ddf1cb2d7360f2f87e81aabb719f) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Implement new SMTP `nodemailer` configuration for sending emails from StudioCMS

  #### SMTP Mailer Configuration:

  - Added SMTP mailer configuration options in the ConfigForm.astro file, including enabling/disabling the mailer and configuring SMTP settings.
  - Introduced new routes and entry points for mailer configuration and test email functionalities in index.ts.

  #### Database Schema Updates:

  - Added a new table StudioCMSMailerConfig to store SMTP mailer settings.
  - Updated existing tables to remove default values from JSON columns. (Potentially breaking)

- [#462](https://github.com/withstudiocms/studiocms/pull/462) [`bf1b118`](https://github.com/withstudiocms/studiocms/commit/bf1b118852da3cd40293b71e96780f25d915c710) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Update the email templates, modifying the user invite API route, and improving the handling of email sending errors.

## 0.1.0-beta.11

### Patch Changes

- [#451](https://github.com/withstudiocms/studiocms/pull/451) [`bceda0a`](https://github.com/withstudiocms/studiocms/commit/bceda0a52fc51ea98914864e75201a147cb0ae46) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Fix integration injection, and when quicktools are usable

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

  #### **`studiocms`**

  - Updated all Dependencies

  #### **`@studiocms/auth`**

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

  #### **`@studiocms/core`**

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

  #### **`@studiocms/dashboard`**

  - Refactor to utilize new `@studiocms/auth` lib for user verification

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Update First time setup routes and API endpoints

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Translation Updated (PR: #391)

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Expand PageData table schema and add Catagory and Tags schemas, and extend WP-importer

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Added Author and Contributor tracking

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Docs, Docs, and more Docs

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Implement new Dashboard design and update API endpoints

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Dynamic Sitemap integration

  ##### Dynamic Sitemap Generation:

  - `packages/studiocms/src/index.ts`: Replaced the static sitemap integration with the new `dynamicSitemap` function to support multiple sitemaps from plugins.
  - `packages/studiocms/src/lib/dynamic-sitemap/index.ts`: Added the `dynamicSitemap` function to generate sitemaps dynamically based on the provided plugin configurations.
  - `packages/studiocms/src/lib/dynamic-sitemap/sitemap-index.xml.ts`: Created a new route to serve the sitemap index file, which lists all the individual sitemaps.

  ##### Plugin Schema Updates:

  - `packages/studiocms/src/schemas/plugins/index.ts`: Updated the plugin schema to include an optional `sitemaps` field, allowing plugins to specify their own sitemap configurations.

  ##### Plugin-Specific Sitemaps:

  - `packages/studiocms_blog/src/index.ts`: Updated the StudioCMS Blog plugin to include its own sitemaps for posts and markdown pages.
  - `packages/studiocms_blog/src/routes/sitemap-md.xml.ts`: Added a new route to generate the sitemap for markdown pages.
  - `packages/studiocms_blog/src/routes/sitemap-posts.xml.ts`: Added a new route to generate the sitemap for blog posts.

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - Remove Astro ViewTransitions/ClientRouter

- [#333](https://github.com/withstudiocms/studiocms/pull/333) [`62ff52f`](https://github.com/withstudiocms/studiocms/commit/62ff52f9f089c9605da9227b0e75c755768ed96c) Thanks [@create-issue-branch](https://github.com/apps/create-issue-branch)! - User invite and creation systems

  ##### User Management Enhancements:

  - Added modals for creating new users and user invites in `InnerSidebarElement.astro` to streamline the user creation process.
  - Implemented new API routes `create-user` and `create-user-invite` to handle user creation and invite processes.
  - Updated `routeMap.ts` to include new endpoints for user creation and invites.

  ##### UI Improvements:

  - Modified icons for 'Create Page' and 'Create Folder' options in `InnerSidebarElement.astro` to use standard document and folder icons.
  - Enhanced the user management dropdown by reordering properties for better readability.
  - Added custom styles for modal bodies to improve the user interface.

  ##### Utility and SDK Updates:

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
