---
"studiocms": patch
---

[Breaking]: Update AstroDB Table Schemas to use prefixed table names (i.e. `Permissions` -> `StudioCMSPermissions` )

This change will require migration to a new database or a full wipe of the current database.

It is recommended to link to a new database and push the new schema changes and migrate your data from the old one.