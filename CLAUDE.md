# CLAUDE.md - StudioCMS AI Assistant Instructions

## Project Overview

**StudioCMS** is a MIT licensed, open-source SSR (Server Side Rendered) Astro-native CMS (Content Management System). It's built specifically for the Astro ecosystem and serves as a dedicated headless CMS solution.

- **Repository**: https://github.com/withstudiocms/studiocms/
- **Documentation**: https://docs.studiocms.dev
- **Main Website**: https://studiocms.dev
- **Community**: [Discord](https://chat.studiocms.dev)
- **Translations**: [Crowdin Project](https://crowdin.com/project/studiocms)

### Key Technologies
- **Framework**: Astro (SSR mode required)
- **Language**: TypeScript
- **Database**: libSQL (via @astrojs/db)
- **Effect System**: Effect-ts
- **Markdown Processing**: MarkedJS with extension support, MarkDoc, native Astro Markdown
- **Authentication**: Multiple providers via plugins (GitHub, Discord, Google, Auth0) + built-in Username/Password
- **Package Manager**: pnpm (preferred), npm, yarn supported

### Project Status
⚠️ **Early Development**: Not yet production-ready. Active development with community contributions welcomed.

## Architecture & Structure

### Monorepo Structure
This is a monorepo containing multiple packages:

- **Core Package**: `packages/studiocms/` - Main CMS functionality
- **Plugins**: Various plugin packages for extending functionality
- **Documentation**: Separate repository at https://github.com/withstudiocms/docs

### Key Configuration Files
- `astro.config.mjs` - Astro configuration with StudioCMS integration
- `studiocms.config.mjs` - StudioCMS-specific configuration (optional but recommended)
- `.prototools` - Specifies Node.js and pnpm versions
- `.env` - Environment variables (see Environment Variables section)

### Required Astro Configuration
```javascript
import { defineConfig } from 'astro/config';
import db from '@astrojs/db';
import node from '@astrojs/node';
import studioCMS from 'studiocms';

export default defineConfig({
  site: 'https://your-domain.tld/', // REQUIRED
  output: 'server', // REQUIRED - SSR mode
  adapter: node({ mode: "standalone" }),
  integrations: [
    db(),
    studioCMS(),
  ],
});
```

## Development Environment Setup

### Prerequisites
- Node.js (version specified in `.prototools`)
- pnpm (preferred package manager)
- libSQL database (Turso, self-hosted, or other libSQL provider)

### Required Environment Variables
```bash
# libSQL URL and Token for AstroDB
ASTRO_DB_REMOTE_URL=libsql://your-database.turso.io
ASTRO_DB_APP_TOKEN=

# Auth encryption key
CMS_ENCRYPTION_KEY="..." # openssl rand --base64 16

# credentials for GitHub OAuth
# OPTIONAL: Github redirect URI is optional, and only required if you have multiple redirect URIs
CMS_GITHUB_CLIENT_ID=
CMS_GITHUB_CLIENT_SECRET=
CMS_GITHUB_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/github/callback

# credentials for Discord OAuth
CMS_DISCORD_CLIENT_ID=
CMS_DISCORD_CLIENT_SECRET=
CMS_DISCORD_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/discord/callback

# credentials for Google OAuth
CMS_GOOGLE_CLIENT_ID=
CMS_GOOGLE_CLIENT_SECRET=
CMS_GOOGLE_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/google/callback

# credentials for auth0 OAuth
CMS_AUTH0_CLIENT_ID=
CMS_AUTH0_CLIENT_SECRET=
CMS_AUTH0_DOMAIN=
CMS_AUTH0_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/auth0/callback
```

### Development Commands
```bash
# Install dependencies
pnpm install

# Push database schema (first time setup or schema updates)
pnpm astro db push --remote

# Development server
pnpm run dev --remote

# Build for production
pnpm run build --remote

# Type checking
pnpm astro check
```

### OAuth Callback URLs
When setting up OAuth providers, use these callback URL patterns:
- Production: `https://your-domain.tld/studiocms_api/auth/<provider>/callback`
- Development: `http://localhost:4321/studiocms_api/auth/<provider>/callback`

## Plugin System

StudioCMS uses a plugin architecture. Plugins are configured in `studiocms.config.mjs`:

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

### Available Plugins
- **@studiocms/blog** - Blog functionality
- **@studiocms/github** - GitHub OAuth authentication
- **@studiocms/discord** - Discord OAuth authentication
- **@studiocms/google** - Google OAuth authentication
- **@studiocms/auth0** - Auth0 OAuth authentication
- See [Package Catalog](https://docs.studiocms.dev/en/package-catalog/) for more plugins

## Internationalization (i18n)

- **Translation Management**: Uses Crowdin for community translations
- **Translation Files**: Located in `packages/studiocms/src/i18n/translations/`
- **Base Language**: English (`en-us.json`)
- **Crowdin Project**: https://crowdin.com/project/studiocms
- **Configuration**: `packages/studiocms/src/i18n/index.ts`

### Translation Contribution Process
1. Visit the Crowdin project page
2. Choose target language
3. Translate strings through Crowdin interface
4. Changes are reviewed and synced to the repository

## Code Standards & Guidelines

### Development Practices
- **TypeScript**: Strict typing enforced
- **Testing**: Write tests for new features when applicable
- **Documentation**: Update docs for new features
- **Effect-ts**: Used for functional programming patterns

### Code Style
- Follow existing patterns in the codebase
- Use meaningful variable names
- Comment complex logic
- Maintain consistency with existing file structures

### Git Workflow
1. Fork the repository
2. Create feature branch from main
3. Make changes with descriptive commits
4. Write/update tests if applicable
5. Update documentation if necessary
6. Open Pull Request with detailed description
7. Link PR to related issues

## Common Development Scenarios

### Adding New Features
1. Check existing issues or create new one
2. Follow the plugin architecture when possible
3. Ensure SSR compatibility
4. Test with different authentication providers
5. Update relevant documentation

### Database Schema Changes
- Use Astro DB schema definitions
- Test migrations thoroughly
- Update type definitions
- Run `astro db push --remote` to apply changes

### Authentication & Security
- Username/Password authentication is built-in
- OAuth providers require their respective plugins (e.g., `@studiocms/github` for GitHub OAuth)
- All authentication goes through StudioCMS Auth system
- Encryption key is required for username/password auth
- OAuth providers need proper callback URL configuration and plugin installation

### Plugin Development
- Follow the StudioCMS plugin interface
- Ensure compatibility with core CMS functionality
- Provide proper TypeScript types
- Include documentation and examples

## Important Notes for AI Assistance

### What StudioCMS Is
- **Headless CMS**: Requires custom frontend development
- **Astro-Native**: Built specifically for Astro ecosystem
- **SSR Required**: Must use server-side rendering
- **Community-Driven**: Open source with active community

### What StudioCMS Is Not
- Not a traditional CMS with built-in themes
- Not compatible with static site generation (SSG)
- Not a WordPress or Drupal replacement
- Not production-ready yet (early development)

### Key Constraints
- **SSR Adapter Required**: Must have an SSR adapter configured (e.g., `@astrojs/node`, `@astrojs/vercel`)
- **Database Required**: Must have libSQL database configured
- **Site URL Required**: Must set `site` option in Astro config
- **Node.js Only**: Bun and Deno are not supported

### Dashboard Access
- Development: `http://localhost:4321/dashboard`
- Production: `https://your-domain.tld/dashboard`
- First-time setup: `/start` endpoint for initial configuration

### Common Issues & Solutions
- **Vite dependency errors**: Normal in development mode, use production build
- **Database connection issues**: Verify ASTRO_DB_* environment variables
- **Authentication problems**: Check CMS_ENCRYPTION_KEY is set
- **OAuth setup**: Ensure correct callback URLs in provider configuration

## Getting Help

### Community Resources
- **Discord**: https://chat.studiocms.dev
- **GitHub Issues**: https://github.com/withstudiocms/studiocms/issues
- **Documentation**: https://docs.studiocms.dev
- **Community Health Files**: https://github.com/withstudiocms/.github

### Reporting Issues
When reporting bugs or requesting features:
1. Search existing issues first
2. Provide detailed reproduction steps
3. Include environment information
4. Include relevant configuration files (redacted)
5. Specify StudioCMS version and Astro version

### Contributing
- Read community health files at https://github.com/withstudiocms/.github
- Follow the contributing guidelines
- Join the Discord community for discussions
- Help with translations via Crowdin project

## Useful Commands Reference

```bash
# Project setup
npm create studiocms@latest        # Create new project with template
pnpm create studiocms@latest      # Create new project with pnpm
astro add db node studiocms       # Add to existing Astro project

# Database operations
astro db push --remote            # Push schema changes
astro db pull --remote            # Pull remote schema

# Development
pnpm dev --remote                 # Start dev server
pnpm build --remote               # Build for production
astro check                       # Type checking

# Package management
pnpm install                      # Install dependencies
pnpm add @studiocms/blog         # Add blog plugin
```

---

*This file helps AI assistants understand StudioCMS architecture, development practices, and common workflows. Keep it updated as the project evolves.*