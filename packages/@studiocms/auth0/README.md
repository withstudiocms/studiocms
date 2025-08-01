# @studiocms/auth0 Plugin

This plugin integrates Auth0 as an OAuth provider for StudioCMS, enabling authentication via Auth0. It sets up the necessary configuration, including required environment variables and endpoint paths.

## Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import auth0 from '@studiocms/auth0';

export default defineStudioCMSConfig({
    // other options here
    plugins: [auth0()]
});
```

## Required ENV Variables

- `CMS_AUTH0_CLIENT_ID`
- `CMS_AUTH0_CLIENT_SECRET`
- `CMS_AUTH0_DOMAIN`
- `CMS_AUTH0_REDIRECT_URI`

## License

[MIT Licensed](./LICENSE).