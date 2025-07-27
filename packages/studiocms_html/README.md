# @StudioCMS/HTML Plugin

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