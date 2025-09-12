# `@withstudiocms/buildkit`

[![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=withstudiocms_buildkit)](https://codecov.io/github/withstudiocms/studiocms)

This is an esbuild based CLI kit for building Astro Integrations

## Usage

### Installation

Install the package in the root of the repo:

1. Install the required dependencies

```bash
pnpm add @withstudiocms/buildkit
```

```bash
npm install @withstudiocms/buildkit
```

```bash
yarn add @withstudiocms/buildkit
```

### Usage

Once you install the buildkit package you now have access to a `buildkit` CLI utility, add the following to your integration scripts:

```json
{
  "scripts": {
    "build": "buildkit build 'src/**/*.{ts,astro,css}'",
    "dev": "buildkit dev 'src/**/*.{ts,astro,css}'"
  }
}
```

The command pattern is `buildkit <command> 'path/to/file or glob/**/**.{ts}' [flags]`

#### Available Flags (All are optional)

- `--no-clean-dist`: Do not clean the dist output during build.
- `--bundle`: Enable bundling.
- `--force-cjs`: Force CJS output.
- `--tsconfig=tsconfig.json`: Allows setting custom tsconfig for build time.
- `--outdir=dist`: Allows settings the output directory.

#### Files considered Assets

The following file extensions will be copied from their src to their respective outputs and not transformed as if they are static assets.

- `.astro`
- `.d.ts`
- `.json`
- `.gif`
- `.jpeg`
- `.jpg`
- `.png`
- `.tiff`
- `.webp`
- `.avif`
- `.svg`

For other content types and how to use them see [The esBuild Docs](https://esbuild.github.io/content-types/)

## Licensing

[MIT Licensed](https://github.com/withstudiocms/studiocms/blob/main/LICENSE).