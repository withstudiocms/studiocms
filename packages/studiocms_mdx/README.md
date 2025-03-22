# @StudioCMS/MDX Plugin

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

## License

[MIT Licensed](./LICENSE).