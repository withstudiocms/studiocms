# GEMINI.md - Google Gemini AI Assistant Instructions

## Project Overview

**StudioCMS** is an MIT licensed, open-source Server-Side Rendered (SSR) Astro-native Content Management System. It's built specifically for the Astro ecosystem and designed as a headless CMS solution requiring custom frontend development.

### Quick Reference
- **Repository**: <https://github.com/withstudiocms/studiocms/>
- **Documentation**: <https://docs.studiocms.dev>
- **Website**: <https://studiocms.dev>
- **Community**: [Discord](https://chat.studiocms.dev)
- **Translations**: [Crowdin Project](https://crowdin.com/project/studiocms)
- **Status**: Early development, not production-ready

## Core Technology Stack

| Technology | Details | Critical Notes |
|------------|---------|----------------|
| **Framework** | Astro | Must use SSR mode, never SSG |
| **Language** | TypeScript | Strict typing enforced |
| **Database** | libSQL via @astrojs/db | Astro Studio is sunset, don't reference it |
| **Effect System** | Effect-ts | Used for functional programming patterns |
| **Package Manager** | pnpm (preferred) | npm/yarn also supported |
| **Runtime** | Node.js only | Bun and Deno are NOT supported |
| **Markdown** | Astro-compatible remark | Custom processor implementation |

## Project Architecture

### Monorepo Structure
```text
packages/
├── studiocms/              # Core CMS package (main)
├── @studiocms/blog/        # Blog plugin
├── @studiocms/github/      # GitHub OAuth plugin  
├── @studiocms/discord/     # Discord OAuth plugin
├── @studiocms/google/      # Google OAuth plugin
├── @studiocms/auth0/       # Auth0 OAuth plugin
└── ...other plugins
```

### Authentication Architecture
- **Built-in**: Username/Password authentication (always available)
- **OAuth**: Plugin-based system - each provider is a separate plugin
- **Required**: `CMS_ENCRYPTION_KEY` environment variable for base auth
- **OAuth Providers**: Require specific plugin installation + configuration

## Essential Configuration

### Astro Configuration (astro.config.mjs)
```javascript
import { defineConfig } from 'astro/config';
import db from '@astrojs/db';
import node from '@astrojs/node';
import studioCMS from 'studiocms';

export default defineConfig({
  site: 'https://your-domain.tld/', // MANDATORY
  output: 'server',                 // MANDATORY - SSR required
  adapter: node({ mode: "standalone" }), // MANDATORY - SSR adapter
  integrations: [
    db(),           // Database integration
    studioCMS(),    // Core CMS
  ],
});
```

### StudioCMS Configuration (studiocms.config.mjs)
```javascript
import { defineStudioCMSConfig } from 'studiocms/config';
import blog from '@studiocms/blog';
import github from '@studiocms/github';

export default defineStudioCMSConfig({
  dbStartPage: false,
  plugins: [
    blog(),
    github(), // Only if using GitHub OAuth
  ],
});
```

### Environment Variables Reference
```bash
# Database Configuration (Required)
ASTRO_DB_REMOTE_URL=libsql://your-database.turso.io
ASTRO_DB_APP_TOKEN=your-database-token

# Base Authentication (Required)
CMS_ENCRYPTION_KEY="base64-encoded-key" # Generate: openssl rand --base64 16

# GitHub OAuth (Optional - requires @studiocms/github plugin)
CMS_GITHUB_CLIENT_ID=your-github-client-id
CMS_GITHUB_CLIENT_SECRET=your-github-client-secret
CMS_GITHUB_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/github/callback

# Discord OAuth (Optional - requires @studiocms/discord plugin)
CMS_DISCORD_CLIENT_ID=your-discord-client-id
CMS_DISCORD_CLIENT_SECRET=your-discord-client-secret
CMS_DISCORD_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/discord/callback

# Google OAuth (Optional - requires @studiocms/google plugin)
CMS_GOOGLE_CLIENT_ID=your-google-client-id
CMS_GOOGLE_CLIENT_SECRET=your-google-client-secret
CMS_GOOGLE_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/google/callback

# Auth0 OAuth (Optional - requires @studiocms/auth0 plugin)
CMS_AUTH0_CLIENT_ID=your-auth0-client-id
CMS_AUTH0_CLIENT_SECRET=your-auth0-client-secret
CMS_AUTH0_DOMAIN=your-auth0-domain
CMS_AUTH0_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/auth0/callback
```

## Development Workflow

### Initial Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables (see above)
# 3. Push database schema
pnpm astro db push --remote

# 4. Start development server
pnpm dev --remote
```

### Common Commands
```bash
# Development
pnpm dev --remote                    # Start dev server with remote DB
pnpm build --remote                  # Build for production with remote DB
pnpm astro check                     # TypeScript checking

# Database operations
pnpm astro db push --remote          # Push schema changes
pnpm astro db pull --remote          # Pull remote schema

# Plugin development
pnpm --filter @studiocms/plugin-name dev    # Work on specific plugin
```

### Package.json Scripts Template
```json
{
  "scripts": {
    "dev": "astro dev --remote",
    "build": "astro check && astro build --remote",
    "astro": "astro"
  }
}
```

## Code Patterns & Standards

### TypeScript Best Practices
```typescript
// Always define proper interfaces
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  publishedAt: Date | null;
}

// Use strict null checks
const post: BlogPost | undefined = await getPost(id);
if (!post) {
  throw new Error('Post not found');
}
```

### Effect-ts Patterns
```typescript
import { Effect, pipe } from "effect";

// Preferred async operation pattern
const fetchUser = (id: string) => pipe(
  Effect.tryPromise(() => database.getUser(id)),
  Effect.catchAll((error) => Effect.fail(new UserNotFoundError(error)))
);

// Error handling pattern
const safeOperation = Effect.tryPromise({
  try: () => riskyDatabaseCall(),
  catch: (error) => new DatabaseError(error)
});
```

### Astro Component Structure
```typescript
---
// Component script section
export interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!-- Template section -->
<article>
  <h1>{title}</h1>
  {description && <p>{description}</p>}
</article>

<style>
  /* Component-scoped styles */
  h1 { color: var(--primary-color); }
</style>
```

### API Route Pattern
```typescript
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Process request
    const data = await processRequest(params);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Something went wrong' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
```

### Database Operations
```typescript
import { db, eq, and } from 'astro:db';
import { Posts } from './schema';

// Always handle potential undefined results
const getPublishedPost = async (slug: string) => {
  const post = await db
    .select()
    .from(Posts)
    .where(and(
      eq(Posts.slug, slug),
      eq(Posts.published, true)
    ))
    .get();
    
  if (!post) {
    throw new Error(`Published post with slug "${slug}" not found`);
  }
  
  return post;
};
```

## Plugin Development Guidelines

### Plugin Structure Template
```typescript
import type { StudioCMSPlugin } from 'studiocms/types';

export interface MyPluginOptions {
  enabled?: boolean;
  customOption?: string;
}

export function myPlugin(options: MyPluginOptions = {}): StudioCMSPlugin {
  return {
    name: 'my-plugin',
    version: '1.0.0',
    hooks: {
      // Plugin lifecycle hooks
      'astro:config:setup': ({ config }) => {
        // Configure Astro integration
      },
      'studiocms:auth:setup': ({ authConfig }) => {
        // Configure authentication if needed
      },
    },
  };
}

export default myPlugin;
```



## Critical Constraints & Gotchas

### ❌ Never Suggest These
- **SSG Mode**: StudioCMS requires SSR (`output: 'server'`)
- **Astro Studio**: It's been sunset, use libSQL directly
- **Bun/Deno**: Only Node.js runtime is supported
- **Built-in OAuth**: OAuth providers are now plugin-based
- **Missing `site` config**: Always required in astro.config.mjs

### ✅ Always Remember
- **SSR Adapter**: Must have an adapter configured (node, vercel, etc.)
- **Environment Variables**: Use `CMS_` prefix for StudioCMS variables
- **Plugin Installation**: OAuth requires specific plugin packages
- **Database Flag**: Use `--remote` flag for database operations
- **TypeScript**: Strict typing throughout the codebase

## Internationalization (i18n)

### Translation System
- **Platform**: Crowdin (<https://crowdin.com/project/studiocms>)
- **Base Language**: English (en-us.json)
- **Location**: `packages/studiocms/src/i18n/translations/`
- **Configuration**: `packages/studiocms/src/i18n/index.ts`

### Contributing Translations
1. Visit the Crowdin project page
2. Select target language
3. Translate strings through web interface
4. Changes are reviewed and merged automatically

### Using i18n in Code
```typescript
import { t } from '../i18n';

// Use translation keys
const welcomeMessage = t('dashboard.welcome');
const errorMessage = t('errors.not_found');
```

## Community & Support

### Getting Help
- **Documentation**: Primary resource at <https://docs.studiocms.dev>
- **Discord Community**: Active support at <https://chat.studiocms.dev>
- **Community Guidelines**: <https://github.com/withstudiocms/.github>
- **GitHub Issues**: Bug reports and feature requests

### Contributing
- **Code of Conduct**: Available in community repository
- **Contributing Guidelines**: Follow established patterns
- **Pull Requests**: Link to related issues, provide clear descriptions
- **Testing**: Write tests for new features when applicable

### Issue Reporting Template
When helping users report issues, suggest this format:
```
**StudioCMS Version**: 
**Astro Version**: 
**Node.js Version**: 
**Package Manager**: pnpm/npm/yarn

**Environment**:
- [ ] Development
- [ ] Production

**Description**:
Clear description of the issue

**Steps to Reproduce**:
1. Step one
2. Step two
3. Issue occurs

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happens

**Configuration**:
~~~javascript
// astro.config.mjs (redacted)
// studiocms.config.mjs (redacted)
~~~
```

## Quick Decision Tree for Common Scenarios

### User Wants Authentication
- **Username/Password**: Built-in, just needs `CMS_ENCRYPTION_KEY`
- **OAuth**: Requires specific plugin installation (`@studiocms/github`, etc.)

### User Has Database Issues  
- **Check**: Environment variables set correctly?
- **Check**: Using `--remote` flag in commands?
- **Check**: libSQL database accessible?

### User Wants to Deploy
- **Requirement**: SSR adapter configured
- **Requirement**: Environment variables in production
- **Requirement**: Database accessible from production environment

### User Reports Errors in Development
- **Vite Errors**: Normal in dev mode, try production build
- **Database Errors**: Verify connection and schema push
- **Auth Errors**: Check encryption key configuration

---

*This file provides Google Gemini with comprehensive context for assisting with StudioCMS development, deployment, and troubleshooting.*