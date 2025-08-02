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

## GrapesJS StudioSDK

Get started with the [GrapesJS StudioSDK](https://grapesjs.com)

### Usage

Add this plugin in your StudioCMS config. (`studiocms.config.mjs`)

```ts
import { defineStudioCMSConfig } from 'studiocms/config';
import wysiwygStudioPlugin from '@studiocms/wysiwyg/studio';

export default defineStudioCMSConfig({
    // other options here
    plugins: [wysiwygStudioPlugin({ license: 'Your_license_here' })]
});
```

## License

[MIT Licensed](./LICENSE).