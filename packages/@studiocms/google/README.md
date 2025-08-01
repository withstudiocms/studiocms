# @studiocms/google Plugin

This plugin integrates Google OAuth authentication into StudioCMS. It defines the necessary configuration, including the required environment variables, OAuth provider details, and the endpoint path for authentication.

## Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import google from '@studiocms/google';

export default defineStudioCMSConfig({
    // other options here
    plugins: [google()]
});
```

## Required ENV Variables

- `CMS_GOOGLE_CLIENT_ID`
- `CMS_GOOGLE_CLIENT_SECRET`
- `CMS_GOOGLE_REDIRECT_URI`

## License

[MIT Licensed](./LICENSE).