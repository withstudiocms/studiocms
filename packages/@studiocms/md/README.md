# @studiocms/md Plugin

[![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=studiocms_md)](https://codecov.io/github/withstudiocms/studiocms)

Add Markdown support to StudioCMS

## Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import mdPlugin from '@studiocms/md';

export default defineStudioCMSConfig({
    // other options here
    plugins: [mdPlugin()]
});
```

## License

[MIT Licensed](./LICENSE).