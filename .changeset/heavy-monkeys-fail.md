---
"effectify": minor
---

Adds new astro-integration-kit-inspired `defineIntegration` utility helper for building Astro integrations with Effect. The `defineIntegration` function introduces schema-validation for integration options using Effect Schema and automatically wraps integration hooks to surface errors as `EffectifyIntegrationHookError` instances. This provides better type safety and error handling for Astro integration authors.

**Behavioral Changes:**
- Integration options are now validated against the provided schema at integration initialization time, throwing `EffectifyIntegrationHookError` with `hook: 'integration:options'` for invalid options
- All Effect-based integration hooks are automatically wrapped to catch and re-throw errors with proper context (hook name, integration name, and error details)
- Hook errors are logged to the console and thrown as `EffectifyIntegrationHookError` instances

**Pre-1.0 Versioning Note:** While this is technically a minor version bump (new feature addition), the introduction of schema-validation and automatic error wrapping represents a behavioral change that integration authors should be aware of. Existing code using raw Effect patterns for Astro integrations should evaluate whether to adopt this new utility for improved error handling and type safety.
