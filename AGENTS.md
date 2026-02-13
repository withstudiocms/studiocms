# AGENTS.md — StudioCMS

# Agent Policies

## Prohibited Actions (All Agents)
* **No Pull Requests:** Do not create or submit Pull Requests (PRs) under any circumstances. 
* **Workflow:** Provide code changes as diffs or full file contents in the chat interface only.
* **Review Only:** You may provide code reviews or suggestions, but you are prohibited from initiating the merge process or opening new PRs.
* **Collaboration:** Collaborate with human developers by providing code snippets, explanations, and guidance, but do not take direct actions in the repository.
  * **Compliance:** Adhere strictly to these constraints to ensure a clear separation of responsibilities between AI agents and human developers.
  * **Human Only:** AI agents are not permitted to generate or modify full code in this repository. All code contributions must be made by human developers based on the guidance provided by AI agents. You may provide code snippets or suggestions, but the final implementation must be done by a human developer.

## Specific Agent Agent Policies
### @coderabbit / @coderabbitai
* Allowed to review, and perform programmed actions as allowed in the current config.

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
| **Database** | @withstudiocms/kysely | Powered by Kysely - supports libSQL, MySQL, PostgreSQL |
| **Effect System** | Effect-ts | Functional programming patterns |
| **Markdown** | MarkedJS, MarkDoc, native Astro MD | Extension support |
| **Auth** | Plugins (GitHub, Discord, Google, Auth0) + built-in username/password | OAuth requires plugin installation |
| **Package Manager** | pnpm 10.17.0 (preferred) | npm/yarn also supported |
| **Runtime** | Node.js >=22.20.0 only | Bun and Deno are NOT supported |

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
├── @studiocms/migrator/          # Database migration utility
├── @studiocms/upgrade/           # Package upgrade utility
├── @studiocms/devapps/           # Development applications
├── @studiocms/html/              # Content renderer plugins
├── @studiocms/markdoc/
├── @studiocms/md/
├── @studiocms/mdx/
├── @studiocms/wysiwyg/
├── @withstudiocms/sdk/           # SDK / internal packages
├── @withstudiocms/kysely/        # Kysely database layer
├── @withstudiocms/effect/
├── @withstudiocms/buildkit/
├── @withstudiocms/auth-kit/      # Authentication utilities
├── @withstudiocms/cli-kit/       # CLI toolkit
├── @withstudiocms/api-spec/      # API specification
├── @withstudiocms/component-registry/
├── @withstudiocms/config-utils/
├── @withstudiocms/internal_helpers/
├── @withstudiocms/template-lang/
└── ...other packages
```

## Dev Environment Setup

### Prerequisites
- Node.js >=22.20.0 (version specified in `.prototools`)
- pnpm 10.17.0 (preferred package manager)
- Database: libSQL (Turso, self-hosted, or local file), MySQL, or PostgreSQL

### Environment Variables
```bash
# Database (Required - Choose ONE option)

# Option 1: libSQL (Turso, local file, or self-hosted)
CMS_LIBSQL_URL=libsql://your-database.turso.io
CMS_LIBSQL_AUTH_TOKEN=your-database-token
# Optional:
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

# Database migrations
pnpm playground:migrate --latest  # Update DB schema to latest version
pnpm create-migration              # Create a new migration

# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm astro check

# Work on a specific plugin
pnpm --filter @studiocms/plugin-name dev

# Upgrade packages
studiocms-upgrade                 # Upgrade StudioCMS packages (Dont use within the monorepo, use in your project that depends on StudioCMS)
```

### OAuth Callback URLs
- Production: `https://your-domain.tld/studiocms_api/auth/<provider>/callback`
- Development: `http://localhost:4321/studiocms_api/auth/<provider>/callback`

### Dashboard Access
- Development: `http://localhost:4321/dashboard`
- Production: `https://your-domain.tld/dashboard`
- First-time setup: `/start` endpoint for initial configuration

## Configuration

### Astro Configuration (`astro.config.mts`)
```javascript
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import studioCMS from 'studiocms';

export default defineConfig({
  site: 'https://your-domain.tld/', // REQUIRED
  output: 'server',                 // REQUIRED — SSR mode
  adapter: node({ mode: "standalone" }), // REQUIRED — SSR adapter
  integrations: [
    studioCMS(),
  ],
});
```

### StudioCMS Configuration (`studiocms.config.mts`)
```javascript
import { defineStudioCMSConfig } from 'studiocms/config';
import blog from '@studiocms/blog';

export default defineStudioCMSConfig({
  dbStartPage: false,
  db: {
    dialect: 'libsql', // or 'mysql' or 'postgres'
  },
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
Database operations are handled internally by StudioCMS core using Kysely via `@withstudiocms/kysely`. The system provides type-safe database operations and supports libSQL, MySQL, and PostgreSQL. Always handle potential null/undefined values in your application code.

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
- Reference Astro Studio — it's been sunset.
- Reference @astrojs/db — replaced by @withstudiocms/kysely.
- Use `astro db` commands — use migration commands instead.
- Assume Bun or Deno support — only Node.js >=22.20.0 is supported.
- Assume OAuth is built-in — OAuth providers require plugin packages.
- Omit the SSR adapter — must have one configured (node, vercel, etc.).
- Show database operation code examples — they're handled internally by StudioCMS core.

### Always do these
- Use `CMS_` prefix for StudioCMS environment variables.
- Use migration commands (`pnpm playground:migrate --latest`, `pnpm create-migration`).
- Use strict TypeScript typing throughout.
- Install the specific plugin package for each OAuth provider (`@studiocms/github`, etc.).
- Configure `db.dialect` in studiocms.config to match your database type.
- Ensure Node.js version is >=22.20.0.

## Testing Instructions

- Run `pnpm astro check` for TypeScript validation.
- Write tests for new features when applicable.
- Test with different authentication providers.
- For database schema changes: create migrations with `pnpm create-migration`, test thoroughly, run `pnpm playground:migrate --latest`.
- Test with different database types (libSQL, MySQL, PostgreSQL) when making database-related changes.

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
| Database connection issues | Are database environment variables set correctly? Is `db.dialect` configured? |
| Migration failures | Is the database accessible? Are credentials correct? |
| Vite dependency errors in dev | Normal in dev mode — try a production build. |
| Deploy failures | Is an SSR adapter configured? Are env vars set in production? Is the DB accessible? Is `db.dialect` set correctly? |

## Community & Support

- **Documentation**: <https://docs.studiocms.dev>
- **Discord**: <https://chat.studiocms.dev>
- **GitHub Issues**: <https://github.com/withstudiocms/studiocms/issues>
- **Community Guidelines**: <https://github.com/withstudiocms/.github>

## Useful Commands Reference

```bash
npm create studiocms@latest        # Create new project from template
pnpm install                       # Install dependencies
pnpm dev                           # Start dev server
pnpm build                         # Build for production
pnpm astro check                   # Type checking
pnpm playground:migrate --latest   # Run database migrations
pnpm create-migration              # Create new migration
pnpm add @studiocms/blog           # Add blog plugin
pnpm --filter @studiocms/plugin dev # Work on specific plugin
studiocms-upgrade                  # Upgrade StudioCMS packages (Dont use this within the monorepo, this is for user-projects only)
```

---

*This file helps AI assistants understand StudioCMS architecture, development practices, and common workflows. Keep it updated as the project evolves.*
