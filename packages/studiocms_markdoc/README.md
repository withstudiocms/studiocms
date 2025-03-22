# @StudioCMS/MarkDoc Plugin

Add MarkDoc support to StudioCMS

## Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import markdocPlugin from '@studiocms/markdoc';

export default defineStudioCMSConfig({
    // other options here
    plugins: [markdocPlugin()]
});
```

## Options

### type
**Type:** `'html'` | `'react-static'` | [`MarkDocRenderer`](#markdocrenderer)
**Default:** `'html'`

Set the type of MarkDoc rendering that you would like to do.

### argParse
**Type:** `ParserArgs` | `undefined`

Optional Parser args for MarkDoc

### transformConfig
**Type:** `ConfigType` | `undefined`

Optional Transform config for MarkDoc

#### MarkDocRenderer
**Type:** `{ name: string; render: (content: import('@markdoc/markdoc').RenderableTreeNode) => Promise<string>; }`

Example Renderer
```ts
import type { RenderableTreeNode } from '@markdoc/markdoc';
import type { MarkDocRenderer } from '@studiocms/markdoc/types';

export const renderHTML: MarkDocRenderer = {
	name: 'html',
	render: async (content: RenderableTreeNode) => {
		return Markdoc.renderers.html(content);
	},
};
```

## License

[MIT Licensed](./LICENSE).