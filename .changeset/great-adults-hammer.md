---
"@withstudiocms/config-utils": patch
"@studiocms/migrator": patch
"studiocms": patch
---

Refactors StudioCMS config processing and loading to simplify how and where configs can load. StudioCMS now no longer supports in-line config, you MUST use a `studiocms.config.*` file.
