---
"@withstudiocms/sdk": patch
"studiocms": patch
---

Replace instance of .returning/returningAll with transactions to properly support SQL dialects that do not support returning such as MySQL
