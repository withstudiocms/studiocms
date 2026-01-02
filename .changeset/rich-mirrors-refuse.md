---
"@withstudiocms/kysely": patch
"studiocms": patch
---

Replaced `@libsql/kysely-client` with `kysely-turso`

#### BREAKING UPDATE

All previous installs relying on `@libsql/kysely-client` should remove the old dependency and install the new `kysely-turso` dependency.