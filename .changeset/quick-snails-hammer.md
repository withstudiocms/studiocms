---
"@studiocms/devapps": patch
---

Refactor WordPress API integration to use effect-based, context-driven configuration instead of direct function arguments. This improves composability, testability, and follows Effect best practices for dependency injection. Affected modules include importers, converters, utilities, and the wp-importer route handler.

