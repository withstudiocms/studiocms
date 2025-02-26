---
"studiocms": patch
---

[MarkDoc] Update MarkDoc support

- Add advanced config options for MarkDoc

```ts
studioCMS({
    rendererConfig: {
        markdocConfig: {
            /**
             * The MarkDoc Content Renderer to use for rendering pages and posts
             *
             * Can be one of the following: `html`, `react-static`, or a custom renderer
             */
            renderType: 'html',
            /**
             * The MarkDoc Arg Parse to use for rendering pages and posts
             */
            argsParse: {
                file: 'string',
                slots: false,
                location: false,
            },
            /**
             * The MarkDoc Transform Config to use for rendering pages and posts
             *
             * @see https://markdoc.dev/docs/config
             */
            transformConfig: {
                nodes: {},
                tags: {},
                variables: {},
                functions: {},
                partials: {},
                validation: {};
            },
        }
    }
})
```

- Add support for MarkDoc `renderType` of `html`, and `react-static`, and custom renderers such as the provided `markdocReactRenderer` from `@studiocms/renderers/exports/markdoc/react`:

```ts
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import studioCMS from 'studiocms';
import markDocRenderReact from '@studiocms/renderers/exports/markdoc/react';

// https://astro.build/config
export default defineConfig({
	//...Rest of Config
	integrations: [
        //...Rest of Config
		react(),
		studioCMS({
            //...Rest of Config
            rendererConfig: {
                markdocConfig: {
                    renderType: markDocRenderReact(components: {}), // Also applies to users with a `studiocms.config.mjs` file.
                }
            }
        }),
	],
});
```