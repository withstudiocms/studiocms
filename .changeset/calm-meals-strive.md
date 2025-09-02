---
"@studiocms/blog": patch
"studiocms": patch
---

Fix: Adjust SDK page lookup to return `undefined` when a page is not found, eliminating noisy Astro errors in development (notably when using Chrome DevTools).
