# AGENTS.md — StudioCMS

## Project Overview

**StudioCMS** is an MIT-licensed, open-source SSR Astro-native CMS built with TypeScript and Effect-ts. It serves as a headless CMS requiring custom frontend development and must run in server-side rendering mode.

- **Repository**: <https://github.com/withstudiocms/studiocms/>
- **Documentation**: <https://docs.studiocms.dev>
- **Website**: <https://studiocms.dev>
- **Community**: [Discord](https://chat.studiocms.dev)
- **Translations**: [Crowdin Project](https://crowdin.com/project/studiocms)
- **Status**: Early development, not production-ready

## Core Technology Stack

| Technology | Details | Notes |
|---|---|---|
| **Framework** | Astro | Must use SSR mode (`output: 'server'`), never SSG |
| **Language** | TypeScript | Strict typing enforced |
| **Database** | libSQL via @astrojs/db | Astro Studio is sunset — don't reference it |
| **Effect System** | Effect-ts | Functional programming patterns |
| **Markdown** | MarkedJS, MarkDoc, native Astro MD | Extension support |
| **Auth** | Plugins (GitHub, Discord, Google, Auth0) + built-in username/password | OAuth requires plugin installation |
| **Package Manager** | pnpm (preferred) | npm/yarn also supported |
| **Runtime** | Node.js only | Bun and Deno are NOT supported |

## Monorepo Structure

```text
packages/
├── studiocms/                    # Core CMS package (main)
├── @studiocms/blog/              # Blog plugin
├── @studiocms/github/            # GitHub OAuth plugin
├── @studiocms/discord/           # Discord OAuth plugin
├── @studiocms/google/            # Google OAuth plugin
├── @studiocms/auth0/             # Auth0 OAuth plugin
├── @studiocms/cloudinary-image-service/
├── @studiocms/s3-storage/
├── @studiocms/migrator/
├── @studiocms/html/              # Content renderer plugins
├── @studiocms/markdoc/
├── @studiocms/md/
├── @studiocms/mdx/
├── @studiocms/wysiwyg/
├── @withstudiocms/sdk/           # SDK / internal packages
├── @withstudiocms/kysely/
├── @withstudiocms/effect/
├── @withstudiocms/buildkit/
└── ...other packages
```

## Dev Environment Setup

### Prerequisites
- Node.js (version specified in `.prototools`)
- pnpm (preferred package manager)
- libSQL database (Turso, self-hosted, or other libSQL provider)

### Environment Variables
```bash
# Database (Required)
ASTRO_DB_REMOTE_URL=libsql://your-database.turso.io
ASTRO_DB_APP_TOKEN=your-database-token

# Base Authentication (Required)
CMS_ENCRYPTION_KEY="..." # Generate: openssl rand -base64 16

# GitHub OAuth (Optional — requires @studiocms/github plugin)
CMS_GITHUB_CLIENT_ID=
CMS_GITHUB_CLIENT_SECRET=
CMS_GITHUB_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/github/callback

# Discord OAuth (Optional — requires @studiocms/discord plugin)
CMS_DISCORD_CLIENT_ID=
CMS_DISCORD_CLIENT_SECRET=
CMS_DISCORD_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/discord/callback

# Google OAuth (Optional — requires @studiocms/google plugin)
CMS_GOOGLE_CLIENT_ID=
CMS_GOOGLE_CLIENT_SECRET=
CMS_GOOGLE_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/google/callback

# Auth0 OAuth (Optional — requires @studiocms/auth0 plugin)
CMS_AUTH0_CLIENT_ID=
CMS_AUTH0_CLIENT_SECRET=
CMS_AUTH0_DOMAIN=
CMS_AUTH0_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/auth0/callback
```

### Setup Commands
```bash
# Install dependencies
pnpm install

# Push database schema (first time or after schema changes)
pnpm astro db push --remote

# Start development server
pnpm dev --remote

# Build for production
pnpm build --remote

# Type checking
pnpm astro check

# Work on a specific plugin
pnpm --filter @studiocms/plugin-name dev
```

### OAuth Callback URLs
- Production: `https://your-domain.tld/studiocms_api/auth/<provider>/callback`
- Development: `http://localhost:4321/studiocms_api/auth/<provider>/callback`

### Dashboard Access
- Development: `http://localhost:4321/dashboard`
- Production: `https://your-domain.tld/dashboard`
- First-time setup: `/start` endpoint for initial configuration

## Configuration

### Astro Configuration (`astro.config.mjs`)
```javascript
import { defineConfig } from 'astro/config';
import db from '@astrojs/db';
import node from '@astrojs/node';
import studioCMS from 'studiocms';

export default defineConfig({
  site: 'https://your-domain.tld/', // REQUIRED
  output: 'server',                 // REQUIRED — SSR mode
  adapter: node({ mode: "standalone" }), // REQUIRED — SSR adapter
  integrations: [
    db(),
    studioCMS(),
  ],
});
```

### StudioCMS Configuration (`studiocms.config.mjs`)
```javascript
import { defineStudioCMSConfig } from 'studiocms/config';
import blog from '@studiocms/blog';

export default defineStudioCMSConfig({
  dbStartPage: false,
  plugins: [
    blog(),
    // Add other plugins here
  ],
});
```

## Code Style & Patterns

### TypeScript
- Strict typing throughout — define interfaces for all data structures.
- Prefer type safety over convenience.
- Handle null/undefined values explicitly.

```typescript
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  publishedAt: Date | null;
}

const post: BlogPost | undefined = await getPost(id);
if (!post) {
  throw new Error('Post not found');
}
```

### Effect-ts
- Use Effect patterns for async operations and error handling.
- Don't mix Promise-based and Effect-based code carelessly.
- Use proper Effect combinators and handle errors at appropriate levels.

```typescript
import { Effect, pipe } from "effect";

const fetchUser = (id: string) => pipe(
  Effect.tryPromise(() => database.getUser(id)),
  Effect.catchAll((error) => Effect.fail(new UserNotFoundError(error)))
);
```

### Astro Components
```astro
---
export interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<article>
  <h1>{title}</h1>
  {description && <p>{description}</p>}
</article>
```

### API Routes
```typescript
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, request }) => {
  const data = await processRequest(params);
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Database Operations
```typescript
import { db, eq, and } from 'astro:db';
import { Posts } from './schema';

const post = await db
  .select()
  .from(Posts)
  .where(and(eq(Posts.slug, slug), eq(Posts.published, true)))
  .get();

if (!post) {
  throw new Error(`Post with slug "${slug}" not found`);
}
```

## Plugin Development

### Plugin Structure
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
      'astro:config:setup': ({ config }) => {
        // Configure Astro integration
      },
    },
  };
}

export default myPlugin;
```

### Plugin Registration
```javascript
// studiocms.config.mjs
import { defineStudioCMSConfig } from 'studiocms/config';
import myPlugin from '@studiocms/my-plugin';

export default defineStudioCMSConfig({
  plugins: [myPlugin()],
});
```

## Internationalization (i18n)

- **Platform**: Crowdin (<https://crowdin.com/project/studiocms>)
- **Base Language**: English (`en-us.json`)
- **Translation Files**: `packages/studiocms/src/i18n/translations/`
- **Configuration**: `packages/studiocms/src/i18n/index.ts`

### Usage
```typescript
import { t } from '../i18n';
const welcomeMessage = t('dashboard.welcome');
```

### Contributing Translations
1. Visit the Crowdin project page.
2. Select target language.
3. Translate strings through the web interface.
4. Changes are reviewed and merged automatically.

## Critical Constraints

### Never do these
- Suggest SSG mode — StudioCMS requires SSR (`output: 'server'`).
- Reference Astro Studio — it's been sunset; use libSQL directly.
- Assume Bun or Deno support — only Node.js is supported.
- Assume OAuth is built-in — OAuth providers require plugin packages.
- Omit `site` config in `astro.config.mjs` — it's always required.
- Omit the SSR adapter — must have one configured (node, vercel, etc.).

### Always do these
- Use `CMS_` prefix for StudioCMS environment variables.
- Use `--remote` flag for database operations (`pnpm dev --remote`, `pnpm build --remote`).
- Use strict TypeScript typing throughout.
- Install the specific plugin package for each OAuth provider (`@studiocms/github`, etc.).

## Testing Instructions

- Run `pnpm astro check` for TypeScript validation.
- Write tests for new features when applicable.
- Test with different authentication providers.
- For database schema changes: test migrations, update types, run `astro db push --remote`.

## PR Instructions

- Fork the repository, create a feature branch from `main`.
- Make changes with descriptive commits.
- Write/update tests if applicable.
- Update documentation if necessary.
- Open a Pull Request with a detailed description and link to related issues.

## Troubleshooting Quick Reference

| Problem | Check |
|---|---|
| Authentication not working | Is `CMS_ENCRYPTION_KEY` set? |
| OAuth failing | Is the plugin installed? Are callback URLs correct? |
| Database connection issues | Are `ASTRO_DB_REMOTE_URL` and `ASTRO_DB_APP_TOKEN` set? Are you using `--remote`? |
| Vite dependency errors in dev | Normal in dev mode — try a production build. |
| Deploy failures | Is an SSR adapter configured? Are env vars set in production? Is the DB accessible? |

## Community & Support

- **Documentation**: <https://docs.studiocms.dev>
- **Discord**: <https://chat.studiocms.dev>
- **GitHub Issues**: <https://github.com/withstudiocms/studiocms/issues>
- **Community Guidelines**: <https://github.com/withstudiocms/.github>

## Useful Commands Reference

```bash
npm create studiocms@latest        # Create new project from template
pnpm install                       # Install dependencies
pnpm dev --remote                  # Start dev server
pnpm build --remote                # Build for production
pnpm astro check                   # Type checking
pnpm astro db push --remote        # Push schema changes
pnpm astro db pull --remote        # Pull remote schema
pnpm add @studiocms/blog           # Add blog plugin
pnpm --filter @studiocms/plugin dev # Work on specific plugin
```

---

*This file helps AI assistants understand StudioCMS architecture, development practices, and common workflows. Keep it updated as the project evolves.*
