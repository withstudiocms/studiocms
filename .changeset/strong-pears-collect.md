---
"studiocms": patch
---

[Refactor]: Update main config schema for renderers.

- Removed `contentRenderer` and `markedConfig` from the main options
- Added config for MarkDoc
- Created new `rendererConfig` section:

```ts
// astro.config.mjs
// https://astro.build/config
export default defineConfig({
    // ...Rest of Astro Config
    integrations: [
        studiocms({
            // ...Rest of StudioCMS Config
            // (This is the same if you use the 'studiocms.config.mjs' file)
            rendererConfig: {
                renderer: 'marked', // Can also be 'astro', or 'markdoc'
                markedConfig: {/* MarkedJS Config */},
                markdocConfig: {/* MarkDoc Config */},
            }
        })
    ]
})
```
