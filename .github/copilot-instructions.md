# GitHub Copilot Instructions for StudioCMS

This file provides context and guidelines for GitHub Copilot when working with the StudioCMS codebase.

## Project Context

StudioCMS is an open-source, SSR Astro-native CMS built with TypeScript and Effect-ts. It's a headless CMS that requires custom frontend development and must run in server-side rendering mode.

### Core Technologies
- **Astro** (SSR mode with adapter required)
- **TypeScript** (strict typing)
- **Effect-ts** (functional programming patterns)
- **libSQL** via @astrojs/db
- **pnpm** (preferred package manager)

### Project Structure
- `packages/studiocms/` - Core CMS package
- Monorepo with plugin architecture
- Plugin-based OAuth authentication

## Code Style & Patterns

### TypeScript Guidelines
- Use strict typing throughout
- Prefer type safety over convenience
- Define interfaces for all data structures
- Use proper Effect-ts patterns for error handling

### Astro-Specific Patterns
```typescript
// Astro components should use proper component syntax
---
// Component script (TypeScript)
export interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!-- Component template -->
<h1>{title}</h1>
```

### Effect-ts Patterns
```typescript
import { Effect, pipe } from "effect";

// Prefer Effect patterns for async operations and error handling
const someOperation = pipe(
  Effect.tryPromise(() => someAsyncOperation()),
  Effect.catchAll((error) => Effect.fail(new SomeError(error)))
);
```

### Database Patterns
- Use Astro DB schema definitions
- Always handle potential null/undefined values
- Prefer type-safe database operations

```typescript
// Example database operation
import { db, eq } from 'astro:db';
import { Users } from '../schema';

const user = await db.select().from(Users).where(eq(Users.id, userId));
```

## Authentication Patterns

### OAuth Provider Plugins
- Each OAuth provider is a separate plugin package
- Use consistent naming: `@studiocms/github`, `@studiocms/discord`, etc.
- Environment variables use `CMS_` prefix: `CMS_GITHUB_CLIENT_ID`

### Built-in Username/Password
- Always requires `CMS_ENCRYPTION_KEY`
- Use proper password hashing and validation

## Plugin Development

### Plugin Structure
```typescript
import type { StudioCMSPlugin } from 'studiocms/types';

export function myPlugin(options?: MyPluginOptions): StudioCMSPlugin {
  return {
    name: 'my-plugin',
    hooks: {
      // Plugin hooks
    },
  };
}
```

### Plugin Registration
```javascript
// studiocms.config.mjs
import { defineStudioCMSConfig } from 'studiocms/config';
import myPlugin from '@studiocms/my-plugin';

export default defineStudioCMSConfig({
  plugins: [
    myPlugin(),
  ],
});
```

## Common Patterns to Follow

### Error Handling
```typescript
// Use Effect-ts for error handling
import { Effect } from "effect";

const safeOperation = Effect.tryPromise({
  try: () => riskyOperation(),
  catch: (error) => new OperationError(error)
});
```

### Configuration Management
- Use proper TypeScript interfaces for all config
- Validate configuration at runtime
- Provide sensible defaults

### Internationalization
```typescript
// Use the i18n system properly
import { t } from '../i18n';

const message = t('key.path');
```

### File Structure
- Group related functionality together
- Use consistent naming conventions
- Separate concerns (auth, database, UI, etc.)

## Environment Variables

### Required
```bash
ASTRO_DB_REMOTE_URL=libsql://your-database.turso.io
ASTRO_DB_APP_TOKEN=your-token
CMS_ENCRYPTION_KEY="..." # Required for auth
```

### OAuth (Plugin-specific)
```bash
CMS_GITHUB_CLIENT_ID=
CMS_GITHUB_CLIENT_SECRET=
CMS_GITHUB_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/github/callback
```

## API Patterns

### Route Handlers
```typescript
// API routes should follow Astro patterns
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, request }) => {
  // Handle GET request
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

### Middleware
- Use proper Astro middleware patterns
- Handle authentication and authorization consistently
- Return appropriate HTTP status codes

## Testing Patterns

### Unit Tests
- Test business logic thoroughly
- Mock external dependencies
- Use proper TypeScript types in tests

### Integration Tests
- Test plugin integration
- Verify authentication flows
- Test database operations

## Common Pitfalls to Avoid

### Astro-Specific
- Don't suggest SSG mode (StudioCMS requires SSR)
- Don't forget the required `site` config in astro.config.mjs
- Remember that server-side code runs in Node.js context

### Database
- Always handle potential database connection issues
- Don't assume data exists without proper checks
- Use proper SQL escaping via Astro DB

### Authentication
- Don't hardcode credentials
- Always validate user permissions
- Use proper session management

### Effect-ts
- Don't mix Promise-based and Effect-based code carelessly
- Use proper Effect combinators
- Handle errors at appropriate levels

## Dependencies

### Core Dependencies
- `astro` - Framework
- `@astrojs/db` - Database layer
- `effect` - Functional programming
- `typescript` - Type safety

### Plugin Dependencies
- Each plugin manages its own dependencies
- Avoid dependency conflicts between plugins
- Use peer dependencies appropriately

## Development Commands

```bash
# Setup
pnpm install
pnpm astro db push --remote

# Development
pnpm dev --remote
pnpm build --remote
pnpm astro check

# Plugin development
pnpm --filter @studiocms/plugin-name dev
```

## Deployment Considerations

### Server Requirements
- Node.js environment
- libSQL database access
- Proper environment variable configuration

### Build Process
- Always build with `--remote` flag for database access
- Ensure all plugins are properly built
- Verify authentication configuration in production

---

*This file helps GitHub Copilot understand StudioCMS patterns and provide contextually appropriate code suggestions.*