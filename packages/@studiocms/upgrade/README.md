# @studiocms/upgrade

A command-line tool for upgrading your StudioCMS installation and dependencies.

You can run this command in your terminal to upgrade your official Astro Project, integrations at the same time as you upgrade StudiOCMS.

## Usage

`@studiocms/upgrade` should not be added as a dependency to your project, but run as a temporary executable whenever you want to upgrade using [`npx`](https://docs.npmjs.com/cli/v10/commands/npx) or [`dlx`](https://pnpm.io/cli/dlx).

**With NPM:**

```bash
npx @studiocms/upgrade
```

**With Yarn:**

```bash
yarn dlx @studiocms/upgrade
```

**With PNPM:**

```bash
pnpm dlx @studiocms/upgrade
```

## Options

### tag (optional)

It is possible to pass a specific `tag` to resolve packages against. If not included, `@studiocms/upgrade` looks for the `latest` tag.

**With NPM:**

```bash
npx @studiocms/upgrade beta
```

**With Yarn:**

```bash
yarn dlx @studiocms/upgrade beta
```

**With PNPM:**

```bash
pnpm dlx @studiocms/upgrade beta
```