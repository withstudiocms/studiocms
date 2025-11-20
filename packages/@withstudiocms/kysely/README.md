# @withstudiocms/kysely

[![codecov](https://codecov.io/github/withstudiocms/studiocms/graph/badge.svg?token=RN8LT1O5E2&component=withstudiocms_kysely)](https://codecov.io/github/withstudiocms/studiocms)


A type-safe database client and migration system for StudioCMS, built on top of [Kysely](https://kysely.dev/). Provides a unified interface for working with libSQL, MySQL, and PostgreSQL databases with runtime schema management and migrations.

**Note:** This is an internal StudioCMS package. It is not intended to be used directly outside of the StudioCMS ecosystem.

## Features

- 🔒 **Type-Safe Database Operations** - Full TypeScript support with Kysely's type-safe query builder
- 🗄️ **Multi-Database Support** - Works with libSQL (Turso), MySQL, and PostgreSQL
- 🔄 **Runtime Schema Management** - Dynamic schema creation and validation
- 🛡️ **Error Handling** - Custom error types for better debugging
- 🔍 **Schema Introspection** - Inspect and validate database schemas at runtime
- ⚡ **Effect-ts Integration** - Functional programming patterns with Effect-ts

## License

[MIT Licensed](./LICENSE)