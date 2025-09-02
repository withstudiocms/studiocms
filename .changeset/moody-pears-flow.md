---
"studiocms": patch
---

Implements new DB table for dynamic config storage in unified table

BREAKING:

Users will be required to run `astro db push --remote` to update their database table schemas.