# @studiocms/html Plugin

[![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=studiocms_html)](https://codecov.io/github/withstudiocms/studiocms)

Add HTML support to StudioCMS

## Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import htmlPlugin from '@studiocms/html';

export default defineStudioCMSConfig({
    // other options here
    plugins: [htmlPlugin()]
});
```

## License

[MIT Licensed](./LICENSE).