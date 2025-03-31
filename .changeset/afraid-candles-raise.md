---
"studiocms": patch
---

Refactor StudioCMS and remove dependencies,

- `package-json` is now removed, as we have an included function to get the latest version from npm directly. (much simpler interface)
- Move functionality from `@matthiesenxyz/integrationUtils` for checkIfUnsafe() util, since that is the only util we are using, into StudioCMS. removing the need for this dep all together