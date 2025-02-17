---
"studiocms": patch
---

New REST API endpoints and Dashboard UI features

New Routes:
- `/studiocms_api/rest/v1/folders`
- `/studiocms_api/rest/v1/folders/[id]`
- `/studiocms_api/rest/v1/pages`
- `/studiocms_api/rest/v1/pages/[id]`
- `/studiocms_api/rest/v1/pages/[id]/history`
- `/studiocms_api/rest/v1/pages/[id]/history/[id]`
- `/studiocms_api/rest/v1/settings`
- `/studiocms_api/rest/v1/users`
- `/studiocms_api/rest/v1/users/[id]`

All routes listed above are behind authentication.

There is the following PUBLIC endpoints that ONLY support GET requests to published pages/folders
- `/studiocms_api/rest/v1/public/pages`
- `/studiocms_api/rest/v1/public/pages/[id]`
- `/studiocms_api/rest/v1/public/folders`
- `/studiocms_api/rest/v1/public/folders/[id]`