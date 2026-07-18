# @studiocms/oauth

[![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=studiocms_oauth)](https://codecov.io/github/withstudiocms/studiocms)

This package provides multiple OAuth providers for StudioCMS, enabling authentication via various OAuth services.

## Providers

- Auth0
- Discord
- GitHub
- Google

## Usage

### Adding a Provider

To add a provider, import the desired provider from `@studiocms/oauth` and include it in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import { auth0, discord, github, google } from '@studiocms/oauth';

export default defineStudioCMSConfig({
    // other options here
    plugins: [
        auth0(),
        discord(),
        github(),
        google()
    ]
});
```

Note you can also import and use individual providers from their respective exports, such as `@studiocms/oauth/auth0`, `@studiocms/oauth/discord`, `@studiocms/oauth/github`, and `@studiocms/oauth/google`.

### Required ENV Variables

#### Auth0

- `CMS_AUTH0_CLIENT_ID`
- `CMS_AUTH0_CLIENT_SECRET`
- `CMS_AUTH0_DOMAIN`
- `CMS_AUTH0_REDIRECT_URI`

#### Discord

- `CMS_DISCORD_CLIENT_ID`
- `CMS_DISCORD_CLIENT_SECRET`
- `CMS_DISCORD_REDIRECT_URI`

#### GitHub

- `CMS_GITHUB_CLIENT_ID`
- `CMS_GITHUB_CLIENT_SECRET`
- `CMS_GITHUB_REDIRECT_URI`

#### Google

- `CMS_GOOGLE_CLIENT_ID`
- `CMS_GOOGLE_CLIENT_SECRET`
- `CMS_GOOGLE_REDIRECT_URI`

## License

[MIT Licensed](./LICENSE).
