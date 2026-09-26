---
name: Repo Guidelines
description: Strict constraints for AI agents
---

# AI Agent Constraints
* **No Pull Requests:** Do not create or submit Pull Requests (PRs) under any circumstances. 
* **Workflow:** Provide code changes as diffs or full file contents in the chat interface only.
* **Review Only:** You may provide code reviews or suggestions, but you are prohibited from initiating the merge process or opening new PRs.
* **Collaboration:** Collaborate with human developers by providing code snippets, explanations, and guidance, but do not take direct actions in the repository.
  * **Compliance:** Adhere strictly to these constraints to ensure a clear separation of responsibilities between AI agents and human developers.
  * **Human Only:** AI agents are not permitted to generate or modify full code in this repository. All code contributions must be made by human developers based on the guidance provided by AI agents. You may provide code snippets or suggestions, but the final implementation must be done by a human developer.

# GitHub Copilot Instructions for StudioCMS

This file provides context and guidelines for GitHub Copilot when working with the StudioCMS codebase.

## Project Context

StudioCMS is an open-source, SSR Astro-native CMS built with TypeScript and Effect-ts. It's a headless CMS that requires custom frontend development and must run in server-side rendering mode.

### Core Technologies
- **Astro** (SSR mode with adapter required)
- **TypeScript** (strict typing)
- **Effect-ts** (functional programming patterns)
- **Database** via @withstudiocms/kysely (powered by Kysely)
  - Supports: libSQL, MySQL, PostgreSQL
- **pnpm** 10.17.0 (preferred package manager)
- **Node.js** >=22.20.0 required

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
- Database operations are handled internally by StudioCMS core
- Uses Kysely via @withstudiocms/kysely for type-safe database operations
- Supports libSQL, MySQL, and PostgreSQL
- Always handle potential null/undefined values in your code

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
// studiocms.config.mts
import { defineStudioCMSConfig } from 'studiocms/config';
import myPlugin from '@studiocms/my-plugin';

export default defineStudioCMSConfig({
  dbStartPage: false,
  db: {
    dialect: 'libsql', // or 'mysql' or 'postgres'
  },
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
# Authentication (Always Required)
CMS_ENCRYPTION_KEY="..." # Generate: openssl rand -base64 16

# Database - Choose ONE of the following:

# Option 1: libSQL (Turso, local file, or self-hosted)
CMS_LIBSQL_URL=libsql://your-database.turso.io
CMS_LIBSQL_AUTH_TOKEN=your-token
# Optional for libSQL:
# CMS_LIBSQL_SYNC_INTERVAL=
# CMS_LIBSQL_SYNC_URL=

# Option 2: MySQL
CMS_MYSQL_DATABASE=your-database-name
CMS_MYSQL_USER=your-database-user
CMS_MYSQL_PASSWORD=your-database-password
CMS_MYSQL_HOST=your-database-host
CMS_MYSQL_PORT=3306

# Option 3: PostgreSQL
CMS_POSTGRES_DATABASE=your-database-name
CMS_POSTGRES_USER=your-database-user
CMS_POSTGRES_PASSWORD=your-database-password
CMS_POSTGRES_HOST=your-database-host
CMS_POSTGRES_PORT=5432
```

### OAuth (Plugin-specific)
```bash
# GitHub OAuth (@studiocms/github)
CMS_GITHUB_CLIENT_ID=
CMS_GITHUB_CLIENT_SECRET=
CMS_GITHUB_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/github/callback

# Discord OAuth (@studiocms/discord)
CMS_DISCORD_CLIENT_ID=
CMS_DISCORD_CLIENT_SECRET=
CMS_DISCORD_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/discord/callback

# Google OAuth (@studiocms/google)
CMS_GOOGLE_CLIENT_ID=
CMS_GOOGLE_CLIENT_SECRET=
CMS_GOOGLE_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/google/callback

# Auth0 OAuth (@studiocms/auth0)
CMS_AUTH0_CLIENT_ID=
CMS_AUTH0_CLIENT_SECRET=
CMS_AUTH0_DOMAIN=
CMS_AUTH0_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/auth0/callback
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
- Don't suggest SSG mode (StudioCMS requires SSR with `output: 'server'`)
- Don't forget the required SSR adapter (node, vercel, etc.)
- Remember that server-side code runs in Node.js context only (Bun and Deno are NOT supported)
- Don't reference Astro Studio - it's been sunset

### Database
- Always handle potential database connection issues
- Don't assume data exists without proper checks
- Database operations are handled by StudioCMS core via Kysely
- Configure correct `db.dialect` for your database type (libSQL, MySQL, or PostgreSQL)

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
- `@withstudiocms/kysely` - Database layer (powered by Kysely)
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

# Database migrations
pnpm playground:migrate --latest  # Update DB schema to latest version
pnpm create-migration              # Create a new migration

# Development
pnpm dev
pnpm build
pnpm astro check

# Plugin development
pnpm --filter @studiocms/plugin-name dev

# Upgrades
studiocms-upgrade                  # Upgrade StudioCMS packages (Dont use within the monorepo, use in your project that depends on StudioCMS)
```

## Deployment Considerations

### Server Requirements
- Node.js environment
- libSQL database access
- Proper environment variable configuration

### Build Process
- Run database migrations before deployment
- Ensure all plugins are properly built
- Verify authentication configuration in production
- Ensure correct database environment variables are set
- Configure `db.dialect` to match your production database

---

*This file helps GitHub Copilot understand StudioCMS patterns and provide contextually appropriate code suggestions.*