export interface GenericOAuth {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

export interface Auth0OAuth extends GenericOAuth {
	domain: string;
}

export type GenericOAuthProviders = 'github' | 'discord' | 'google';

export type OAuthProvider = GenericOAuthProviders | 'auth0';

export type LibSQLDbDialectConfig = {
	dialect: 'libsql';
	url: string;
	authToken?: string;
	syncInterval?: number;
	syncUrl?: string;
};

export type MySQLDbDialectConfig = {
	dialect: 'mysql';
	database: string;
	user: string;
	password: string;
	host: string;
	port: number;
};

export type PostgresDbDialectConfig = {
	dialect: 'postgres';
	database: string;
	user: string;
	password: string;
	host: string;
	port: number;
};

export type DbDialectConfig =
	| LibSQLDbDialectConfig
	| MySQLDbDialectConfig
	| PostgresDbDialectConfig;

export type EnvBuilderOptionsBase = {
	dbConfig?: DbDialectConfig;
	encryptionKey?: string;
	oAuthOptions?: OAuthProvider[];
};

export type EnvBuilderOptions = EnvBuilderOptionsBase & {
	[K in OAuthProvider as K extends 'auth0' ? 'auth0OAuth' : `${K}OAuth`]?: K extends 'auth0'
		? Auth0OAuth
		: GenericOAuth;
};

export const ExampleEnv: string = `# StudioCMS Environment Variables (Example)

# Database configuration (choose one)

# libSQL
# CMS_LIBSQL_URL=libsql://your-database.turso.io or file:./path/to/your/database.db (required)
# CMS_LIBSQL_AUTH_TOKEN=<your-auth-token> (optional)
# CMS_LIBSQL_SYNC_INTERVAL= (optional)
# CMS_LIBSQL_SYNC_URL= (optional)

# MySQL
# CMS_MYSQL_DATABASE=<your-database-name>
# CMS_MYSQL_USER=<your-database-user>
# CMS_MYSQL_PASSWORD=<your-database-password>
# CMS_MYSQL_HOST=<your-database-host>
# CMS_MYSQL_PORT=<your-database-port>

# PostgreSQL
# CMS_PG_DATABASE=<your-database-name>
# CMS_PG_USER=<your-database-user>
# CMS_PG_PASSWORD=<your-database-password>
# CMS_PG_HOST=<your-database-host>
# CMS_PG_PORT=<your-database-port>

# Auth encryption key
CMS_ENCRYPTION_KEY="..." # openssl rand --base64 16`;

/**
 * Builds the environment file content for StudioCMS project.
 */
export function buildEnvFile(envBuilderOpts: EnvBuilderOptions): string {
	function parseDBConfig() {
		if (!envBuilderOpts.dbConfig) return '';

		switch (envBuilderOpts.dbConfig?.dialect) {
			case 'libsql': {
				return `
# libSQL
CMS_LIBSQL_URL=${envBuilderOpts.dbConfig?.url}
${envBuilderOpts.dbConfig?.authToken ? `CMS_LIBSQL_AUTH_TOKEN=${envBuilderOpts.dbConfig?.authToken}` : ''}
${envBuilderOpts.dbConfig?.syncInterval ? `CMS_LIBSQL_SYNC_INTERVAL=${envBuilderOpts.dbConfig?.syncInterval}` : ''}
${envBuilderOpts.dbConfig?.syncUrl ? `CMS_LIBSQL_SYNC_URL=${envBuilderOpts.dbConfig?.syncUrl}` : ''}`;
			}
			case 'mysql': {
				return `
# MySQL
CMS_MYSQL_DATABASE=${envBuilderOpts.dbConfig?.database}
CMS_MYSQL_USER=${envBuilderOpts.dbConfig?.user}
CMS_MYSQL_PASSWORD=${envBuilderOpts.dbConfig?.password}
CMS_MYSQL_HOST=${envBuilderOpts.dbConfig?.host}
CMS_MYSQL_PORT=${envBuilderOpts.dbConfig?.port}`;
			}
			case 'postgres': {
				return `
# PostgreSQL
CMS_PG_DATABASE=${envBuilderOpts.dbConfig?.database}
CMS_PG_USER=${envBuilderOpts.dbConfig?.user}
CMS_PG_PASSWORD=${envBuilderOpts.dbConfig?.password}
CMS_PG_HOST=${envBuilderOpts.dbConfig?.host}
CMS_PG_PORT=${envBuilderOpts.dbConfig?.port}`;
			}
		}
	}

	return `# StudioCMS Environment Variables
	
# Database configuration
${parseDBConfig()}

# Auth encryption key
CMS_ENCRYPTION_KEY="${envBuilderOpts.encryptionKey || ''}" # openssl rand --base64 16

${
	envBuilderOpts.githubOAuth
		? `
# credentials for GitHub OAuth
CMS_GITHUB_CLIENT_ID=${envBuilderOpts.githubOAuth?.clientId}
CMS_GITHUB_CLIENT_SECRET=${envBuilderOpts.githubOAuth?.clientSecret}
CMS_GITHUB_REDIRECT_URI=${envBuilderOpts.githubOAuth?.redirectUri}/studiocms_api/auth/github/callback
`
		: ''
}

${
	envBuilderOpts.discordOAuth
		? `
# credentials for Discord OAuth
CMS_DISCORD_CLIENT_ID=${envBuilderOpts.discordOAuth?.clientId}
CMS_DISCORD_CLIENT_SECRET=${envBuilderOpts.discordOAuth?.clientSecret}
CMS_DISCORD_REDIRECT_URI=${envBuilderOpts.discordOAuth?.redirectUri}/studiocms_api/auth/discord/callback
`
		: ''
}

${
	envBuilderOpts.googleOAuth
		? `
# credentials for Google OAuth
CMS_GOOGLE_CLIENT_ID=${envBuilderOpts.googleOAuth?.clientId}
CMS_GOOGLE_CLIENT_SECRET=${envBuilderOpts.googleOAuth?.clientSecret}
CMS_GOOGLE_REDIRECT_URI=${envBuilderOpts.googleOAuth?.redirectUri}/studiocms_api/auth/google/callback
`
		: ''
}

${
	envBuilderOpts.auth0OAuth
		? `
# credentials for auth0 OAuth
CMS_AUTH0_CLIENT_ID=${envBuilderOpts.auth0OAuth?.clientId}
CMS_AUTH0_CLIENT_SECRET=${envBuilderOpts.auth0OAuth?.clientSecret}
CMS_AUTH0_DOMAIN=${envBuilderOpts.auth0OAuth?.domain}
CMS_AUTH0_REDIRECT_URI=${envBuilderOpts.auth0OAuth?.redirectUri}/studiocms_api/auth/auth0/callback
`
		: ''
}
`;
}
