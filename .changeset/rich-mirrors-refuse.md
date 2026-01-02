---
"@withstudiocms/kysely": patch
"studiocms": patch
---

Replaced `@libsql/kysely-libsql` with `kysely-turso`

#### BREAKING UPDATE

All previous installs relying on `@libsql/kysely-libsql` should remove the old dependency and install the new `kysely-turso` dependency.