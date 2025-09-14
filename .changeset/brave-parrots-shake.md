---
"studiocms": patch
---

Enable the "Draft" toggle on the Edit Page for all pages (including the `index` page) so the `draft` field is submitted with the form. Previously the disabled control omitted this field from the payload, preventing changes to draft status.

