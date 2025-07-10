---
"studiocms": patch
---

Migrate Image Service system into plugin system. This change now means that setting an imageService requires a ImageService plugin to be added to plugin array, as well as setting the `preferredImageService` in the features setting on the StudioCMS config.
