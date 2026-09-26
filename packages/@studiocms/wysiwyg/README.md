# @studiocms/wysiwyg

[![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=studiocms_wysiwyg)](https://codecov.io/github/withstudiocms/studiocms)

Add a WYSIWYG editor to your StudioCMS dashboard.

## Overview

Add this plugin to your StudioCMS config (`studiocms.config.mjs` or `.mts`):

```ts
import wysiwyg from '@studiocms/wysiwyg';

export default defineStudioCMSConfig({
    // other options here
    plugins: [wysiwyg()]
});
```

## License

[MIT Licensed](./LICENSE).