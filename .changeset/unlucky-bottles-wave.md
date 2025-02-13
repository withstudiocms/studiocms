---
"studiocms": patch
---

[Migrate/Deprecation]: customRendererPlugin moved to StudioCMSRendererConfig

- Deprecation of StudioCMSPluginOptions defined CustomRenderers
- Add new option to define renderers from StudioCMSOptions config:


```ts
// astro.config.mjs
function simpleHTMLRenderer(content: string) {
    return {
        name: 'simple-html-renderer',
        renderer: async (content: string) => {
			return `<p>${content}</p>`;
		}
    };
}

// https://astro.build/config
export default defineConfig({
    // ...Rest of Astro Config
    integrations: [
        studiocms({
            // ...Rest of StudioCMS Config
            // (This is the same if you use the 'studiocms.config.mjs' file)
            rendererConfig: {
                renderer: simpleHTMLRenderer,
            }
        })
    ]
})
```