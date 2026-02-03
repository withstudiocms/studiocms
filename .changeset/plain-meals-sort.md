---
"studiocms": patch
---

Fix client regex in frontend to allow for slashes within a slug, but not on the outside. This unblocks creating pages under sub-paths just using the slug (e.g., `docs/getting-started`) and only affects client-side validation.
