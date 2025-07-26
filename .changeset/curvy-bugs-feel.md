---
"studiocms": patch
---

Refactor component registry into new custom handler for reading component props during initialization for usage within StudioCMS Dashboard editors

#### Breaking Changes
- `studiocms:component-proxy` has been replaced by `studiocms:component-registry`
- Added `studiocms:component-registry/runtime` virtual module which exports types, and the following helpers, `getRegistryComponents` and `getRendererComponents` used for getting Components with props, and the renderer components respectively.
- `importComponentKeys` has been carried over but deprecated in favor for the new `getRendererComponents` function.