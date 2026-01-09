---
"@withstudiocms/component-registry": patch
---

Tweaks `transformHTML` sanitization so StudioCMS components and custom elements are always passed through (caller-provided `sanitizeOpts` cannot disable `allowComponents`/`allowCustomElements`).
