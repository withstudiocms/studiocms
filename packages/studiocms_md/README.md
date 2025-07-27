# @StudioCMS/MD Plugin

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