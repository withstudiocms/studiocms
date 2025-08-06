---
"studiocms": patch
---

Adds new `StudioCMSPluginData` table for usage by StudioCMS plugins. As well as new SDK plugins utilities for dynamic table typing as well.

#### Breaking Update

Users will be required to run `astro db push --remote` to update your table schema so that the table schema is updated before running the new version!