# @studiocms/migrator

Utility tool to ensure that all your content, configurations, and settings are preserved during the migration process to the latest version, allowing you to take advantage of the new features and improvements in StudioCMS without losing any of your valuable data.

## Usage

Run the following command in the root of your StudioCMS project that contains the `.env` file as well as the `studiocms.config.*` config file.

```sh
npx @studiocms/migrator
```

### Environment variable requirements

#### AstroDB

For migrating data from previous version you simply need your previous DB's env data.

```sh
# AstroDB
ASTRO_DB_REMOTE_URL=libsql://your-old-database.turso.io
ASTRO_DB_APP_TOKEN=<your-auth-token>
```

#### StudioCMS Database

For running this migrator you will need a fresh empty DB to work against. With the latest version's of StudioCMS, we now support libSQL, MySQL, and PostgreSQL.

##### LibSQL

```sh
# libSQL
CMS_LIBSQL_URL=libsql://your-new-database.turso.io or file:./path/to/your/database.db (required)
CMS_LIBSQL_AUTH_TOKEN=<your-auth-token> (optional)
CMS_LIBSQL_SYNC_INTERVAL= (optional)
CMS_LIBSQL_SYNC_URL= (optional)
```

##### MySQL

```sh
# MySQL
CMS_MYSQL_DATABASE=<your-database-name>
CMS_MYSQL_USER=<your-database-user>
CMS_MYSQL_PASSWORD=<your-database-password>
CMS_MYSQL_HOST=<your-database-host>
CMS_MYSQL_PORT=<your-database-port>
```

##### PostgreSQL

```sh
# PostgreSQL
CMS_PG_DATABASE=<your-database-name>
CMS_PG_USER=<your-database-user>
CMS_PG_PASSWORD=<your-database-password>
CMS_PG_HOST=<your-database-host>
CMS_PG_PORT=<your-database-port>
```

## License

[MIT License](./LICENSE)