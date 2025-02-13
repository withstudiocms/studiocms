---
"@studiocms/devapps": patch
---

Update the libsqlstudio url to new outerbase studio url, and various other cleanups

Code Simplification:
- Removed the libSQLEndpoint import and related code in libsql-viewer.ts. Replaced custom result transformation functions with transformTursoResult from @outerbase/sdk-transform.
- Removed the createClient.ts script and its references, as it is no longer needed.

Configuration Changes:
- Simplified the libSQLViewer configuration schema in schema/index.ts to a boolean value.
- Removed the libSQLViewer endpoint and related virtual imports in index.ts.