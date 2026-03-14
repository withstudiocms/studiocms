# create-studiocms

[![NPM Version](https://img.shields.io/npm/v/create-studiocms?style=for-the-badge&logo=npm)](https://npm.im/create-studiocms)
[![Formatted with Biome](https://img.shields.io/badge/Formatted_with-Biome-60a5fa?style=for-the-badge&logo=biome)](https://biomejs.dev/)

CLI Utility Toolkit used for setting up a new project using StudioCMS Ecosystem packages, as well as other utilities.

## Quickstart

### Use with NPM

```sh
npm create studiocms@latest
```

### Use with PNPM

```sh
pnpm create studiocms
```

### Use with Yarn

```sh
yarn create studiocms
```

`create-studiocms` automatically runs in _interactive_ mode, but you can also specify your project name and template with command line arguments.

```sh
# npm
npm create studiocms@latest --template studiocms/basics --project-name my-studiocms-project

# yarn
yarn create studiocms --template studiocms/basics --project-name my-studiocms-project

# pnpm
pnpm create studiocms --template studiocms/basics --project-name my-studiocms-project
```

[Check out the full list][templates] of templates, available on GitHub.

When using `--template` the default behavior is to search the Templates repo and is declared as folders. for example the `studiocms/basics` templates points to the `basics` project within the `studiocms` folder at the root of the repo.

## Full CLI Options and commands

### Main Entrypoint

```log
Usage: create-studiocms [options]

This command will open an interactive CLI prompt to guide you through
the process of creating a new StudioCMS(or StudioCMS Ecosystem package)
project using one of the available templates.

Options:
  -t, --template <template>          The template to use.
  -r, --template-ref <template-ref>  The template reference to use.
  -p, --project-name <project-name>  The name of the project.
  -i, --install                      Install dependencies.
  -g, --git                          Initialize a git repository.
  -y, --yes                          Skip all prompts and use default values.
  -n, --no                           Skip all prompts and use default values.
  -q, --skip-banners                 Skip all banners and messages.
  -d, --dry-run                      Do not perform any actions.
  -h, --help                         display help for command
  -v, --version                      Output the current version of the CLI Toolkit.
  --do-not-install                   Do not install dependencies.
  --do-not-init-git                  Do not initializing a git repository.
  --color                            force color output
  --no-color                         disable color output
```

[templates]: https://github.com/withstudiocms/templates