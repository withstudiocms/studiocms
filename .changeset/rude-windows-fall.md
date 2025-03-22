---
"@studiocms/blog": patch
"studiocms": patch
---

Refactor rendering system to rely on plugin PageTypes instead of the old built-in system, this will allow new page types to easily bring their own renderer that can get called from the main renderer component