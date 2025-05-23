# StudioCMS

![Readme's Banner](./assets/banner-readme.png)

[![NPM Version](https://img.shields.io/npm/v/studiocms)](https://npm.im/studiocms)
[![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![Crowdin](https://badges.crowdin.net/studiocms/localized.svg)](https://crowdin.com/project/studiocms)

This is an SSR CMS built with AstroDB for the Astro Ecosystem.

To see how to get started, check out the [StudioCMS Docs](./packages/studiocms/README.md).

> [!IMPORTANT]
> This project is still in early development and it is not yet ready for production use. If you encounter any issues or have ideas for new features, please let us know by [opening an issue](https://github.com/withstudiocms/studiocms/issues/new/choose) on our GitHub repository.

## Sponsors

<a href="https://tur.so/studiocms" rel="sponsored" target="_blank"><img src="https://turso.tech/logokit/turso-logo-illustrated.svg" width="400px" /></a>
<a href="https://www.skip2.net/?utm_source=studiocms" rel="sponsored" target="_blank"><img src="./assets/skip2-wordmark-red.svg" width="400px" /></a>

## Contributing

We welcome contributions from the community! Whether it's bug reports, feature requests, or code contributions, we appreciate your help in making this project better.

### Bug Reports and Feature Requests

If you encounter any bugs or have ideas for new features, please open an issue on our [GitHub repository](https://github.com/withstudiocms/studiocms). When creating a new issue, please provide as much detail as possible, including steps to reproduce the issue (for bugs) and a clear description of the proposed feature.

### Code Contributions

We welcome contributions from the community! Whether it's bug reports, feature requests, or code contributions, we appreciate your help in making this project better. To get started read our [Contributing Guide](https://docs.studiocms.dev/contributing/getting-started/)

Please note that by contributing to this project, you agree to our [Code of Conduct](https://github.com/withstudiocms/.github/blob/main/CODE_OF_CONDUCT.md).

## Chat with Us

We have an active community of developers on the StudioCMS [Discord Server](https://chat.studiocms.dev/). Feel free to join and connect with other contributors, ask questions, or discuss ideas related to this project or other StudioCMS projects.

## Our ToolSet

For an up-to-date list of our main tools check out our [`.prototools`](.prototools) file

For more information about Proto checkout [Proto's Website](https://moonrepo.dev/proto)

## How to use the playgrounds

At the moment these are the current steps for setting up the main StudioCMS playground.

This is intended for testing and development, since we have not yet released a package to play with use these instruction _at your own risk_ This project is still very experimental

The primary playground is the [Node Playground](./playground/)

Steps to get a running playground should be the following:

- Clone the GitHub repository
- Run `pnpm i --frozen-lockfile`
- Change `dbStartPage` in the node playground's [StudioCMS config](./playground/studiocms.config.mjs) config to `true`
- Ensure `.env` variables are configured (see [`.env.demo`](./playground/.env.demo) for an example of available environment variables)

  Commands to run:

  - `pnpm playground:push` - Push to your libSQL database assigned via environment variables
  - `pnpm dev` - Starts the Dev server connected to the linked database (as well as builds all repo packages)

Once that process completes successfully you are ready to navigate to http://localhost:4321/start and follow the instructions to get started.

It will redirect and ask you to shutdown and change the above mentioned config option `dbStartPage` to `false` at which point that will enable full functionality of the CMS. you can now restart the dev server with `pnpm dev` to continue viewing your new site!

That will give you a running dev environment of what we work with daily.

To start the playground again use the command `pnpm dev`

## Licensing

[MIT Licensed](./LICENSE).
