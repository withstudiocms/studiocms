# @studiocms/discord Plugin

[![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=studiocms_discord)](https://codecov.io/github/withstudiocms/studiocms)

This plugin integrates Discord as an OAuth authentication provider for StudioCMS. It sets up the necessary configuration, including the required environment variables and OAuth endpoints.

## Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import discord from '@studiocms/discord';

export default defineStudioCMSConfig({
    // other options here
    plugins: [discord()]
});
```

## Required ENV Variables

- `CMS_DISCORD_CLIENT_ID`
- `CMS_DISCORD_CLIENT_SECRET`
- `CMS_DISCORD_REDIRECT_URI`

## License

[MIT Licensed](./LICENSE).