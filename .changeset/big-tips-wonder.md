---
"@studiocms/markdoc": patch
"@studiocms/wysiwyg": patch
"@studiocms/blog": patch
"@studiocms/html": patch
"@studiocms/mdx": patch
"@studiocms/md": patch
---

Refactors rendering system from Astro components to JavaScript modules, enabling plugin-based augmentation system. Renderers now export PluginRenderer objects that support prefix, suffix, and component augmentation.
