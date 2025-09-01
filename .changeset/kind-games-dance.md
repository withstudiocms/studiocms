---
"studiocms": patch
---

BREAKING: Remove deprecated locals from middleware in favor of a joined StudioCMS locals object.

Removed top-level Astro.Locals keys:
  - SCMSGenerator, SCMSUiGenerator, latestVersion, siteConfig, defaultLang, routeMap
  - userSessionData, emailVerificationEnabled, userPermissionLevel
  - wysiwygCsrfToken (renamed)

New location:
  - Access these under event.locals.StudioCMS.<key>

Renames:
  - wysiwygCsrfToken → editorCSRFToken (under StudioCMS)

Migration examples:
  Before:
    const { siteConfig, defaultLang } = Astro.locals;
  After:
    const { siteConfig, defaultLang } = Astro.locals.StudioCMS;

  Before:
    const token = Astro.locals.wysiwygCsrfToken;
  After:
    const token = Astro.locals.StudioCMS.editorCSRFToken;