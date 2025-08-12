# @withstudiocms/effect

This package contains various Effect utilities for StudioCMS/Astro projects

## Install

To get started using this package, simply use your package manager to install it!

```sh
npm install @withstudiocms/effect
```

```sh
pnpm add @withstudiocms/effect
```

```sh
yarn add @withstudiocms/effect
```

## Usage

There is various exports available for different aspects of this package. While the default export, exports everything, you can also choose to use the dedicated sub-exports as well.

### Default export

Contains all exported functions and types from all included modules.

```ts
import { Effect, runEffect } from '@withstudiocms/effect`;
```

### Effect Export

Contains a bundled export of the main Effect packages and utils, as well as custom Effect utils hand-tailored by our team.

```ts
import { Effect, runEffect, appendSearchParamsToUrl, HTTPClient } from '@withstudiocms/effect/effect`;
```

### Astro Export

Contains Astro-specific utilities for handling APIRoutes, Middleware and API context with Effect.

```ts
import { 
    defineAPIRoute, defineMiddleware, defineMiddlewareRouter,
    readAPIContextJson, parseAPIContextJson, readAPIContextFormData,
    parseAPIContextFormDataToObject, parseFormDataEntryToString
} from '@withstudiocms/effect/astro`;
```

## License

[MIT Licensed](./LICENSE)