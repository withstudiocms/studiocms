---
"studiocms": major
---

Saving an existing page was updating both publishedAt and updatedAt, causing the original publish date to be lost.Now, publishedAt is set only when a page is first published or when a draft is published, while updatedAt is updated on later edits.
