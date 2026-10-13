# @StudioCMS/MDX Plugin

[![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=studiocms_mdx)](https://codecov.io/github/withstudiocms/studiocms)

Add MDX support to StudioCMS

## Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import mdxPlugin from '@studiocms/mdx';

export default defineStudioCMSConfig({
    // other options here
    plugins: [mdxPlugin()]
});
```

## Options

### remarkPlugins
**Type:** `PluggableList` | `undefined`

Optional list of Remark plugins

### rehypePlugins
**Type:** `PluggableList` | `undefined`

Optional list of Rehype plugins

### recmaPlugins
**Type:** `PluggableList` | `undefined`

Optional list of recma plugins

### remarkRehypeOptions
**Type:** `remarkRehypeOptions` | `undefined`

Optional: options for remarkRehype

## Content safety

The built-in renderer supports Markdown (including GFM) and safe, static intrinsic HTML elements from the sanitizer's allowlist. It rejects MDX JavaScript expressions, ESM imports/exports, custom React components, dynamic/spread attributes, event handlers, and unsafe URLs. Rendered HTML is sanitized after the configured rehype plugins run.

This is an input restriction, not a general JavaScript sandbox or a defense against resource-exhaustion attacks. Configured Remark, Rehype, and Recma plugins are trusted application code and must be reviewed accordingly. If full MDX execution is required, use a custom renderer and only process content from trusted authors.

## License

[MIT Licensed](./LICENSE).