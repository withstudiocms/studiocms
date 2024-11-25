# StudioCMS - Development Apps

Collection* of useful tools available during dev mode in Astro

## Installation

Install the integration **automatically** using the Astro CLI:

```bash
pnpm astro add @studiocms/devapps
```

```bash
npx astro add @studiocms/devapps
```

```bash
yarn astro add @studiocms/devapps
```

Or install it **manually**:

1. Install the required dependencies

```bash
pnpm add @studiocms/devapps
```

```bash
npm install @studiocms/devapps
```

```bash
yarn add @studiocms/devapps
```

2. Add the integration to your astro config

```diff
+import devApps from "@studiocms/devapps";

export default defineConfig({
  integrations: [
+    devApps(),
  ],
});
```

## Usage

All tools will only be available during `astro dev` and will not be available during production deployments!

### libSQL Viewer

#### Requires

The following env variables set (`@astrojs/db`):
- **`ASTRO_DB_REMOTE_URL`**
- **`ASTRO_DB_APP_TOKEN`**

#### Preview

- Toolbar app

![toolbar](./assets/preview-toolbar.png)

- Toolbar app Embedded

![toolbar-embedded](./assets/preview-embeddedapp.png)

- Full page View

![pageview](./assets/preview-page.png)

### WordPress Importer

#### Requires

- StudioCMS Integration
- A current WP Install
- `@studiocms/blog` (Optional for importing Posts under a blog)

#### Preview

- Toolbar app

![WP-importer](./assets/wp-importer.png)

## Licensing

[MIT Licensed](https://github.com/astrolicious/studiocms/blob/main/LICENSE).

