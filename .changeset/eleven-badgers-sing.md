---
"@withstudiocms/effect": patch
---

Move Effect packages to peerDependencies.

BREAKING CHANGE: Consumers may need to install the following peer deps:
 - effect
 - @effect/cli
 - @effect/platform
 - @effect/platform-node

See package.json for exact version ranges.