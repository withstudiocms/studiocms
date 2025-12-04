---
"studiocms": patch
---

Refactors code structure to move all code that does not need to be built into it's own frontend folder, allowing us to no longer ship both SRC and DIST, instead having DIST and FRONTEND folders instead. Frontend folder being specific to serving and handling Astro pages and endpoints
