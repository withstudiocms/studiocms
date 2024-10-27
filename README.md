# StudioCMS

![Readme's Banner](./www/assets/banner-readme.png)

[![NPM Version](https://img.shields.io/npm/v/studiocms)](https://npm.im/studiocms)
[![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev/)
[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)

This is an SSR CMS built with AstroDB for the Astro Ecosystem.

To see how to get started, check out the [StudioCMS README](./packages/studiocms/README.md).

> [!IMPORTANT]
> This project is still in early development and it is not yet ready for production use. If you encounter any issues or have ideas for new features, please let us know by [opening an issue](https://github.com/astrolicious/studiocms/issues/new/choose) on our GitHub repository.

## Sponsor

<a href="https://turso.tech" rel="sponsored" target="_blank"><img src="https://turso.tech/logokit/turso-logo-illustrated.svg" width="400px" /></a>

## Contributing

We welcome contributions from the community! Whether it's bug reports, feature requests, or code contributions, we appreciate your help in making this project better. To get started read our [Contributing Guide](https://docs.studiocms.xyz/start-here/contributing/)

## Chat with Us

We have an active community of developers on the Astrolicious [Discord Server](https://chat.astrolicious.dev/). Feel free to join and connect with other contributors, ask questions, or discuss ideas related to this project or other Astrolicious projects.

## Our ToolSet

For an up-to-date list of our main tools check out our [`.prototools`](.prototools) file

For more information about Proto checkout [Proto's Website](https://moonrepo.dev/proto)

## This is a [`Moonrepo`](https://moonrepo.dev)

Follow install instructions listed on Moonrepo's docs, and you'll be all set to go! Its even a super easy single line command you put in your terminal!

To use the dev server the command is `moon run playground:dev`

> Note: You can always fallback to standard pnpm, Please ensure your version matches our project, and run `pnpm i --frozen-lockfile` to install deps

## How to use the playgrounds

At the moment these are the current steps for setting up the main StudioCMS playground.

This is intended for testing and development, since we have not yet released a package to play with use these instruction _at your own risk_ This project is still very experimental

The primary playground is the [Node Playground](./playgrounds/node/)

Steps to get a running playground should be the following:

- clone repo
- run `pnpm i --frozen-lockfile`
- change `dbStartPage` in the [node playground's](./playgrounds/node/studiocms.config.mjs) config to `true`
- read the first time setup instructions listed in the [main package readme](./packages/studiocms/README.md#first-start-and-setup) then replace the astro db commands with the following:

  Commands to run:

  - `pnpm playground:login` - Login your CLI to Astro Studio
  - `pnpm playground:push` - Creates the base tables on the remote database.
  - `pnpm playground:dev` - Starts the Dev server connected to the linked database

Once that process completes successfuly you are ready to navigate to http://localhost:4321/start and follow the instructions to get started.

It will redirect and ask you to shutdown and change the above mentioned config option `dbStartPage` to `false` at which point that will enable full functionality of the CMS. you can now restart the dev server with `astro dev --remote` to continue viewing your new site!

That will give you a running dev environment of what i work with daily... the only other thing to get the full functionality currently is to configure a gitub oAuth app for the [Dashboard and authentication](./packages/studiocms/README.md#authentication)

To start the playground again use the command `pnpm playground:dev`

## Licensing

[MIT Licensed](./LICENSE).
