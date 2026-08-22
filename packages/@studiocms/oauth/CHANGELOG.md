# @studiocms/oauth

## 0.1.0

### Minor Changes

- [#1537](https://github.com/withstudiocms/studiocms/pull/1537) [`f7646fe`](https://github.com/withstudiocms/studiocms/commit/f7646fedc637f250d04844f9a6e1ac8126ec5015) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Breaking Change: This version drops support for Astro v5

- [#1537](https://github.com/withstudiocms/studiocms/pull/1537) [`f7646fe`](https://github.com/withstudiocms/studiocms/commit/f7646fedc637f250d04844f9a6e1ac8126ec5015) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Updates for Astro v6, Lints `.astro` files, and scope CSS files to prevent weird CSS leakage across pages.

- [#1500](https://github.com/withstudiocms/studiocms/pull/1500) [`3a0beb1`](https://github.com/withstudiocms/studiocms/commit/3a0beb13f25e38c4d7d98cc9644623eb82964851) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Migrates packages to use tsdown instead of custom esbuild pipeline

- [#1579](https://github.com/withstudiocms/studiocms/pull/1579) [`55b6083`](https://github.com/withstudiocms/studiocms/commit/55b6083fa48b00e125bbb06bc1e83bf846e9c7b8) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Remove dependency on Astro integration kit

- [#1610](https://github.com/withstudiocms/studiocms/pull/1610) [`19132e8`](https://github.com/withstudiocms/studiocms/commit/19132e8e3d5a3a5c0a63d46131c0f575920a4c2e) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Introduces new consolidated oauth package

- [#1650](https://github.com/withstudiocms/studiocms/pull/1650) [`0ba332e`](https://github.com/withstudiocms/studiocms/commit/0ba332e1a4fa4d9de785db31333778404b8dc321) Thanks [@Adammatthiesen](https://github.com/Adammatthiesen)! - Integrate now deprecated arctic code into package to handle all oauth processing

### Patch Changes

- Updated dependencies [[`72148f4`](https://github.com/withstudiocms/studiocms/commit/72148f4d5eae2108f6995c980d1834128da4f020), [`4838ea1`](https://github.com/withstudiocms/studiocms/commit/4838ea1f6809ccaea382b86075a261f5d03186b4), [`49cdf12`](https://github.com/withstudiocms/studiocms/commit/49cdf12fb73eed117e1ab3fa4225d11a8a13554f), [`ef73e14`](https://github.com/withstudiocms/studiocms/commit/ef73e14e7c72ef92a06341d7fed2dfba5070a4b0), [`010cb29`](https://github.com/withstudiocms/studiocms/commit/010cb293dc73cbd3d7fd42fac43072f24c908a60), [`2bd1616`](https://github.com/withstudiocms/studiocms/commit/2bd161637b58a64fab90b1e8fb0d5d9d1c64f166), [`4bf7ffa`](https://github.com/withstudiocms/studiocms/commit/4bf7ffa7486db51e5d0f023c4380da9f47c25d57), [`e7675af`](https://github.com/withstudiocms/studiocms/commit/e7675af5855f8cdb2b24d23fd33b66e418e80623), [`9a1678a`](https://github.com/withstudiocms/studiocms/commit/9a1678a44cc23c7253c7aacdd38e8ed94fc6a589), [`f7646fe`](https://github.com/withstudiocms/studiocms/commit/f7646fedc637f250d04844f9a6e1ac8126ec5015), [`33b879f`](https://github.com/withstudiocms/studiocms/commit/33b879f4475dcd9bf948a4fc4d386a90994b98c7), [`67efa61`](https://github.com/withstudiocms/studiocms/commit/67efa613fe870e187ee37e322df6e935eea57eaf), [`fb12698`](https://github.com/withstudiocms/studiocms/commit/fb126989d9d576ec968b15b97fd89d9074f4d680), [`40cb35c`](https://github.com/withstudiocms/studiocms/commit/40cb35c519d033883c2e46f3592f4ca109be9371), [`2d42cbd`](https://github.com/withstudiocms/studiocms/commit/2d42cbdab4a9930c7f0c190d04c86ea216a571c5), [`55b6083`](https://github.com/withstudiocms/studiocms/commit/55b6083fa48b00e125bbb06bc1e83bf846e9c7b8), [`0d2c3c9`](https://github.com/withstudiocms/studiocms/commit/0d2c3c9d37676bac5b0a8187c7e8a78bf3feb38b), [`3a8e4ce`](https://github.com/withstudiocms/studiocms/commit/3a8e4ceea5b1c5e31a42e5e7a2402258f9c149cc), [`a5a5769`](https://github.com/withstudiocms/studiocms/commit/a5a57694c1a273196b754acce545a8d259b3423f), [`76400b0`](https://github.com/withstudiocms/studiocms/commit/76400b06202c081390bf1b28f2a7c07a2d141a99), [`418b743`](https://github.com/withstudiocms/studiocms/commit/418b743c6387878f82599f94ad7185947ec6815d), [`5b68503`](https://github.com/withstudiocms/studiocms/commit/5b6850349f1ac9d2acdc9cbb8bcd79b7561de769), [`0ba332e`](https://github.com/withstudiocms/studiocms/commit/0ba332e1a4fa4d9de785db31333778404b8dc321), [`193e4aa`](https://github.com/withstudiocms/studiocms/commit/193e4aad1f31bed18c5f88167513363cf3bd1b01), [`0800f15`](https://github.com/withstudiocms/studiocms/commit/0800f15e461e5aac2915c9d63bbff4d39f81e5b3)]:
  - @withstudiocms/effect@0.5.0
  - @withstudiocms/internal_helpers@0.3.0
  - @withstudiocms/auth-kit@0.2.0
  - @withstudiocms/kysely@0.3.0
