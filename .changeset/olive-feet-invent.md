---
"studiocms": patch
---

[Refactor]: Update virtual module generation

- Move `virtual:studiocms/astromdremarkConfig` and rename to `studiocms:renderer/astroMarkdownConfig` from the `@studiocms/core` to `@studiocms/renderers`
- New virtual module for the rendererConfig `studiocms:renderer/config`