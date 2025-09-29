---
"studiocms": patch
---

Deprecates the legacy StudioCMSSiteConfig, StudioCMSMailerConfig, and StudioCMSNotificationSettings tables to be fully removed in a future release.

Note: Users will need to run `astro db push --remote` to ensure their DB schemas are up-to-date.