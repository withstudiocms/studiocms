# @withstudiocms/component-registry

Create a virtual Astro Component registry with ease.

## Install

To get started using this package, simply use your package manager to install it!

```sh
npm install @withstudiocms/component-registry
```

```sh
pnpm add @withstudiocms/component-registry
```

```sh
yarn add @withstudiocms/component-registry
```

## Usage

### Component Registry

The `ComponentRegistry` allows you to register Astro components and manage their prop definitions:

```typescript
import { Effect } from '@withstudiocms/effect';
import { ComponentRegistry } from '@withstudiocms/component-registry';

// Create a registry instance
const registry = await Effect.runPromise(
  Effect.gen(function* () {
    const registry = yield* ComponentRegistry;
    return registry;
  }).pipe(Effect.provide(ComponentRegistry.Default))
);

// Register a component from an Astro file
await Effect.runPromise(
  registry.registerComponentFromFile('./components/MyComponent.astro')
);

// Get component props
const componentProps = await Effect.runPromise(
  registry.getComponentProps('MyComponent')
);

// Validate props against component definition
const validation = await Effect.runPromise(
  registry.validateProps('MyComponent', {
    title: 'Hello World',
    count: 42
  })
);

// Get all registered components
const allComponents = await Effect.runPromise(
  registry.getAllComponents()
);
```

### Component Proxy

Create proxies for existing Astro components to enable dynamic rendering:

```typescript
import { createComponentProxy } from '@withstudiocms/component-registry';

// Inside an Astro component
// body?.components contains imported Astro components from a virtual module
// Example: { 'example-comp': ExampleComp, 'foo-comp': FooComp }
const components = createComponentProxy($$result, body?.components);

// Transform HTML that contains component placeholders
if (body?.html) {
  const transformedHtml = await transformHTML(
    body.html, 
    components, 
    body.sanitizeOpts
  );
}
```

### Runtime System

For more advanced use cases, the component registry provides a runtime system with virtual modules:

```typescript
import { setupRendererComponentProxy, createRenderer } from '@withstudiocms/component-registry';

// Setup component proxy with virtual module components
const components = await setupRendererComponentProxy(result);

// Create a renderer function for HTML transformation
const renderer = await createRenderer(result, sanitizeOpts, preRenderer);

// Use the renderer to transform HTML content
const transformedHtml = await renderer(htmlContent);
```

The runtime system automatically imports components from the virtual module `'virtual:component-registry-internal-proxy'` and provides a complete rendering pipeline.

### Virtual Module System

The component registry uses virtual modules to dynamically import and manage components:

```typescript
// Virtual module imports (handled by the registry)
import * as registry from 'virtual:component-registry-internal-proxy';
import { componentKeys, componentProps } from 'virtual:component-registry-internal-proxy';

// Components are automatically available through the runtime system
// componentKeys: ['example_comp', 'foo_comp']
// componentProps: { 'example_comp': ComponentProps, 'foo_comp': ComponentProps }
```

### HTML Transformation

Transform HTML strings with component swapping and sanitization:

```typescript
import { transformHTML } from '@withstudiocms/component-registry';

const html = `
  <div>
    <my-button text="Click me"></my-button>
    <my-card title="Hello" content="World"></my-card>
  </div>
`;

const components = {
  'my-button': (props: { text: string }) => 
    `<button class="btn">${props.text}</button>`,
  'my-card': (props: { title: string; content: string }) =>
    `<div class="card"><h3>${props.title}</h3><p>${props.content}</p></div>`
};

// Transform with sanitization
const result = await transformHTML(html, components, {
  allowedElements: ['div', 'button', 'h3', 'p'],
  allowedAttributes: { '*': ['class'] }
});
```

### Prop Parsing and Validation

The registry automatically parses TypeScript interfaces and JSDoc comments:

```typescript
// Astro component with JSDoc comments
// components/UserCard.astro
---
/**
 * User card component for displaying user information
 */
interface Props {
  /** The user's display name */
  name: string;
  /** The user's avatar URL */
  avatar?: string;
  /** Whether the user is online */
  isOnline: boolean;
}

const { name, avatar, isOnline } = Astro.props;
---

<div class="user-card">
  {avatar && <img src={avatar} alt={name} />}
  <h3>{name}</h3>
  <span class="status">{isOnline ? 'Online' : 'Offline'}</span>
</div>
```

```typescript
// Register and validate
await Effect.runPromise(
  registry.registerComponentFromFile('./components/UserCard.astro')
);

const validation = await Effect.runPromise(
  registry.validateProps('UserCard', {
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
    isOnline: true
  })
);

console.log(validation.valid); // true
console.log(validation.errors); // []
```

### Utilities

The package provides various utility functions:

```typescript
import { 
  convertHyphensToUnderscores, 
  convertUnderscoresToHyphens,
  dedent,
  integrationLogger 
} from '@withstudiocms/component-registry';

// String conversion utilities
const underscored = convertHyphensToUnderscores('my-component'); // 'my_component'
const hyphenated = convertUnderscoresToHyphens('my_component'); // 'my-component'

// Remove leading indentation
const cleanText = dedent(`
  This text has
    leading indentation
  that will be removed
`);

// Integration logging
await integrationLogger({
  logLevel: 'info',
  logger: astroLogger,
  verbose: true
}, 'Component registered successfully');
```

## API Reference

### ComponentRegistry

The main registry class for managing Astro components.

#### Methods

- `registerComponentFromFile(filePath: string, componentName?: string)`: Register a component from an Astro file
- `getComponentProps(componentName: string)`: Get the props definition for a component
- `validateProps(componentName: string, props: Record<string, unknown>)`: Validate props against component definition
- `getAllComponents()`: Get all registered components

### createComponentProxy

Creates a proxy for components that can be either strings or functions.

```typescript
function createComponentProxy(
  result: SSRResult, 
  components: ComponentType = {}
): ComponentType
```

### transformHTML

Transforms HTML with component swapping and sanitization.

```typescript
function transformHTML(
  html: string,
  components: ComponentType,
  sanitizeOpts?: SanitizeOptions
): Promise<string>
```

## Error Handling

The package uses Effect-ts for error handling:

```typescript
import { ComponentNotFoundError, FileParseError } from '@withstudiocms/component-registry';

try {
  await Effect.runPromise(registry.getComponentProps('NonExistentComponent'));
} catch (error) {
  if (error instanceof ComponentNotFoundError) {
    console.log('Component not found:', error.componentName);
  }
}
```

## TypeScript Support

All functions and classes are fully typed with TypeScript:

```typescript
import type { 
  AstroComponentProps, 
  ComponentRegistryEntry, 
  PropValidationResult 
} from '@withstudiocms/component-registry';

// Use types in your code
const component: AstroComponentProps = {
  name: 'MyComponent',
  props: [
    {
      name: 'title',
      type: 'string',
      optional: false,
      description: 'The component title'
    }
  ]
};
```

## License

[MIT Licensed](./LICENSE)
