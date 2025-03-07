---
"studiocms": patch
---

Implement new SMTP `nodemailer` configuration for sending emails from StudioCMS

#### SMTP Mailer Configuration:
- Added SMTP mailer configuration options in the ConfigForm.astro file, including enabling/disabling the mailer and configuring SMTP settings.
- Introduced new routes and entry points for mailer configuration and test email functionalities in index.ts.

#### Database Schema Updates:
- Added a new table StudioCMSMailerConfig to store SMTP mailer settings.
- Updated existing tables to remove default values from JSON columns. (Potentially breaking)
