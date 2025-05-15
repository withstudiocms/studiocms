---
"studiocms": patch
---

Refactor middleware, add new effect utils, and effect cleanup

- Middleware files are now Effects.
- Updated all current effects to Effect Services, and created new effect utils in `lib/effects/`
  - New SMTP Effect for wrapping `nodemailer`
  - New Logger utils for Effect
  - Updated lib/auth effects
  - Updated lib/mailer effect
  - Updated lib/notifier effect