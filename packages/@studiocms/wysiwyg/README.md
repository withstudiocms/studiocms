# @StudioCMS/WYSIWYG Plugin

Add A WYSIWYG editor to your StudioCMS dashboard

## Standard

Built on top of the `grapesjs` OSS package, to provide a custom WYSIWYG editing experience within StudioCMS

### Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import wysiwygPlugin from '@studiocms/wysiwyg';

export default defineStudioCMSConfig({
    // other options here
    plugins: [wysiwygPlugin()]
});
```

## License

[MIT Licensed](./LICENSE).