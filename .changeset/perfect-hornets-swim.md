---
"studiocms": patch
"@studiocms/auth": patch
"@studiocms/core": patch
---

Introduce Dashboard i18n logic

- `studiocms` & `@studiocms/core`:
    - Introduce new virtual module `studiocms:i18n`:
    This module includes utilities for our new i18n system.
    - Add new LanguageSelector component
    - Add `en-us` translation file. (`packages/studiocms_core/i18n/translations/`)

- `@studiocms/auth`:
    - Update login/signup routes to utilize new i18n translations
    - Transition routes to Hybrid type setup, All API routes will remain server rendered, while pages are now prerendered (Server islands when needed).