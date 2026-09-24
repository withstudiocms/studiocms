---
"studiocms": minor
"@studiocms/blog": patch
---

Removes the deprecated `studiocmsMinimumVersion` field from the Plugin API (`StudioCMSPluginBaseSchema`) and cleans up stale JSDoc that still referenced version checks. Plugins still passing the field will get a TypeScript excess-property error in `definePlugin()`; use `peerDependencies` to declare StudioCMS compatibility instead.
