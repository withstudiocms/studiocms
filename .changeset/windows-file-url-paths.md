---
"@studiocms/markdown-remark": patch
"@withstudiocms/component-registry": patch
"studiocms": patch
---

Fix `astro dev` failing at config load on Windows: resolve `config.root` with `fileURLToPath` instead of `URL.pathname`, and import translation files by file URL instead of a bare path
