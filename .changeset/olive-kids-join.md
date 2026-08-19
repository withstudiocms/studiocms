---
"@withstudiocms/kysely": patch
---

fix `_kysely_schema_v1` primary-key collisions when several migrations run in one transaction. schema-history ids are now `max(now(), max(id)+1)` instead of a second-granularity timestamp, the retry loop is gone, and `saveSchema` no longer swallows errors.
