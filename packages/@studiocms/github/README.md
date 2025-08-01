# @studiocms/github Plugin

This plugin integrates GitHub as an OAuth authentication provider for StudioCMS. It sets up the necessary authentication service, including the provider's name, endpoint path, required environment variables, and SVG logo.

## Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import github from '@studiocms/github';

export default defineStudioCMSConfig({
    // other options here
    plugins: [github()]
});
```

## Required ENV Variables

- `CMS_GITHUB_CLIENT_ID`
- `CMS_GITHUB_CLIENT_SECRET`
- `CMS_GITHUB_REDIRECT_URI`

## License

[MIT Licensed](./LICENSE).