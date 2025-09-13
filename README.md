# StudioCMS

![Readme's Banner](./assets/banner-readme.png)

[![NPM Version](https://img.shields.io/npm/v/studiocms)](https://npm.im/studiocms)
[![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/withstudiocms/studiocms/ci-testing.yml?branch=main&logo=githubactions&logoColor=%232088FF&label=repo%20tests)](https://github.com/withstudiocms/studiocms/actions/workflows/ci-testing.yml)
[![Crowdin](https://badges.crowdin.net/studiocms/localized.svg)](https://crowdin.com/project/studiocms)
[![pkg.pr.new](https://img.shields.io/badge/Continuous%20Releases-pkg.pr.new-8A2BE2?logo=pkgsrc&logoColor=FFF)](https://pkg.pr.new/~/withstudiocms/studiocms)
[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)

StudioCMS is an SSR Headless CMS built with AstroDB for the Astro Ecosystem.

To see how to get started with StudioCMS, check out the [StudioCMS Docs](https://docs.studiocms.dev).

> [!IMPORTANT]
> This project is still in early development and it is not yet ready for production use. If you encounter any issues or have ideas for new features, please let us know by [opening an issue](https://github.com/withstudiocms/studiocms/issues/new/choose) on our GitHub repository.
>
> During our `0.1.0-beta.x` phase, breaking changes may ship in patch releases.

## Packages in this repository

### Astro Integrations

| Package | Test Coverage |
| ------- | ------------- |
| [studiocms](./packages/studiocms/) | Not Yet Available |
| [@studiocms/devapps](./packages/@studiocms/devapps/) | Not Yet Available |

### StudioCMS Plugins

| Package | Category | Test Coverage |
| ------- | -------- | ------------- |
| [@studiocms/auth0](./packages/@studiocms/auth0/) | Authentication | Not Yet Available |
| [@studiocms/discord](./packages/@studiocms/discord/) | Authentication | Not Yet Available |
| [@studiocms/github](./packages/@studiocms/github/) | Authentication | Not Yet Available |
| [@studiocms/google](./packages/@studiocms/google/) | Authentication | Not Yet Available |
| [@studiocms/html](./packages/@studiocms/html/) | Renderer | Not Yet Available |
| [@studiocms/markdoc](./packages/@studiocms/markdoc/) | Renderer | Not Yet Available |
| [@studiocms/md](./packages/@studiocms/md/) | Renderer | Not Yet Available |
| [@studiocms/mdx](./packages/@studiocms/mdx/) | Renderer | Not Yet Available |
| [@studiocms/wysiwyg](./packages/@studiocms/wysiwyg/) | Renderer | Not Yet Available |
| [@studiocms/cloudinary-image-service](./packages/@studiocms/cloudinary-image-service/) | Image Service | Not Yet Available |
| [@studiocms/blog](./packages/@studiocms/blog/) | Front-End | Not Yet Available |

### Tools and Utilities

| Package | Test Coverage |
| ------- | ------------- |
| [@withstudiocms/auth-kit](./packages/@withstudiocms/auth-kit/) | [![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=withstudiocms_auth_kit)](https://codecov.io/github/withstudiocms/studiocms) |
| [@withstudiocms/buildkit](./packages/@withstudiocms/buildkit/) | [![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=withstudiocms_buildkit)](https://codecov.io/github/withstudiocms/studiocms) |
| [@withstudiocms/component-registry](./packages/@withstudiocms/component-registry/) | [![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=withstudiocms_component_registry)](https://codecov.io/github/withstudiocms/studiocms) |
| [@withstudiocms/config-utils](./packages/@withstudiocms/config-utils/) | [![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=withstudiocms_config_utils)](https://codecov.io/github/withstudiocms/studiocms) |
| [@withstudiocms/effect](./packages/@withstudiocms/effect/) | [![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=withstudiocms_effect)](https://codecov.io/github/withstudiocms/studiocms) |
| [@withstudiocms/internal_helpers](./packages/@withstudiocms/internal_helpers/) | [![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=withstudiocms_internal_helpers)](https://codecov.io/github/withstudiocms/studiocms) |

## Getting Started with our Development Playground

The StudioCMS Playground is intended for usage when developing StudioCMS within the monorepo and should not be used to directly test or host StudioCMS. If your goal is to test our CMS, please use our latest release from [npm](https://npm.im/studiocms).

Steps to get a running playground should be the following:

- Clone the GitHub repository
- Run `pnpm i --frozen-lockfile`
- Change `dbStartPage` in the Node playground's [StudioCMS config](./playground/studiocms.config.mjs) to `true`.
- Ensure `.env` variables are configured (see [`.env.demo`](./playground/.env.demo) for an example of available environment variables)
- Run the following in this order:
  - `pnpm build:studiocms` - Build the StudioCMS packages (required to get the current table schema for the StudioCMS integration)
  - `pnpm playground:push` - Push to your libSQL database assigned via environment variables
  - `pnpm dev` - Starts the Dev server connected to the linked database (as well as builds all repo packages)

Once that process completes successfully you are ready to navigate to `http://localhost:4321/start` and follow the instructions to get your database initialized.

Once complete, you will be redirected and asked to shut down and change the config option `dbStartPage` to `false`. This enables full functionality of the CMS. You can now restart the dev server with `pnpm dev` to continue working with our development playground.

That will give you the dev environment we work with daily.

To start the playground again, use the command `pnpm dev`.

## Our ToolSet

For an up-to-date list of our main tools check out our [`.prototools`](.prototools) file

For more information about Proto, check out [Proto's website](https://moonrepo.dev/proto).

## Contributing

We welcome contributions from the community! Whether it's bug reports, feature requests, or code contributions, we appreciate your help in making this project better.

### Bug Reports and Feature Requests

If you encounter any bugs or have ideas for new features, please open an issue on our [GitHub repository](https://github.com/withstudiocms/studiocms). When creating a new issue, please provide as much detail as possible, including steps to reproduce the issue (for bugs) and a clear description of the proposed feature.

### Code Contributions

We welcome contributions from the community! Whether it's bug reports, feature requests, or code contributions, we appreciate your help in making this project better. To get started read our [Contributing Guide](https://docs.studiocms.dev/contributing/getting-started/)

Please note that by contributing to this project, you agree to our [Code of Conduct](https://github.com/withstudiocms/.github/blob/main/CODE_OF_CONDUCT.md).

## Chat with Us

We have an active community of developers on the StudioCMS [Discord Server](https://chat.studiocms.dev/). Feel free to join and connect with other contributors, ask questions, or discuss ideas related to this project or other StudioCMS projects.

## Sponsors

<a href="https://tur.so/studiocms" rel="sponsored" target="_blank"><img src="https://turso.tech/logokit/turso-logo-illustrated.svg" width="400px" alt="Turso logo" /></a>
<a href="https://www.skip2.net/?utm_source=studiocms" rel="sponsored" target="_blank"><img src="https://www.skip2.net/images/logo.svg" width="400px" alt="Skip2 logo" /></a>

## Licensing

[MIT Licensed](./LICENSE).
