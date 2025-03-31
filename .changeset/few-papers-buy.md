---
"studiocms": patch
---

Refactor SDK and page scripts

- SDK cache is now busted when it should be
- Content management page sidebar now refreshes
- You can now hide the default index in the siteConfig on the dashboard

### NOTICE (non-breaking schema update)

- You will need to push the new schema `astro db push --remote`