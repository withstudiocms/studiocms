export interface GenericOAuth {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

export interface Auth0OAuth extends GenericOAuth {
	domain: string;
}

export interface EnvBuilderOptions {
	astroDbRemoteUrl?: string;
	astroDbToken?: string;
	encryptionKey?: string;
	oAuthOptions?: ('github' | 'discord' | 'google' | 'auth0')[];
	githubOAuth?: GenericOAuth;
	discordOAuth?: GenericOAuth;
	googleOAuth?: GenericOAuth;
	auth0OAuth?: Auth0OAuth;
}

export const ExampleEnv: string = `# StudioCMS Environment Variables (Example)

# libSQL URL and Token for AstroDB
ASTRO_DB_REMOTE_URL=libsql://your-database.turso.io
ASTRO_DB_APP_TOKEN=

# Auth encryption key
CMS_ENCRYPTION_KEY="..." # openssl rand --base64 16

# credentials for GitHub OAuth
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
CMS_AUTH0_REDIRECT_URI=http://localhost:4321/studiocms_api/auth/auth0/callback`;

export function buildEnvFile(envBuilderOpts: EnvBuilderOptions): string {
	return `# StudioCMS Environment Variables

# libSQL URL and Token for AstroDB
ASTRO_DB_REMOTE_URL=${envBuilderOpts.astroDbRemoteUrl}
ASTRO_DB_APP_TOKEN=${envBuilderOpts.astroDbToken}

# Auth encryption key
CMS_ENCRYPTION_KEY="${envBuilderOpts.encryptionKey}" # openssl rand --base64 16

${envBuilderOpts.githubOAuth ? `
# credentials for GitHub OAuth
CMS_GITHUB_CLIENT_ID=${envBuilderOpts.githubOAuth?.clientId}
CMS_GITHUB_CLIENT_SECRET=${envBuilderOpts.githubOAuth?.clientSecret}
CMS_GITHUB_REDIRECT_URI=${envBuilderOpts.githubOAuth?.redirectUri}/studiocms_api/auth/github/callback
` : ""}

${envBuilderOpts.discordOAuth ? `
# credentials for Discord OAuth
CMS_DISCORD_CLIENT_ID=${envBuilderOpts.discordOAuth?.clientId}
CMS_DISCORD_CLIENT_SECRET=${envBuilderOpts.discordOAuth?.clientSecret}
CMS_DISCORD_REDIRECT_URI=${envBuilderOpts.discordOAuth?.redirectUri}/studiocms_api/auth/discord/callback
` : ""}

${envBuilderOpts.googleOAuth ? `
# credentials for Google OAuth
CMS_GOOGLE_CLIENT_ID=${envBuilderOpts.googleOAuth?.clientId}
CMS_GOOGLE_CLIENT_SECRET=${envBuilderOpts.googleOAuth?.clientSecret}
CMS_GOOGLE_REDIRECT_URI=${envBuilderOpts.googleOAuth?.redirectUri}/studiocms_api/auth/google/callback
` : ""}

${envBuilderOpts.auth0OAuth ? `
# credentials for auth0 OAuth
CMS_AUTH0_CLIENT_ID=${envBuilderOpts.auth0OAuth?.clientId}
CMS_AUTH0_CLIENT_SECRET=${envBuilderOpts.auth0OAuth?.clientSecret}
CMS_AUTH0_DOMAIN=${envBuilderOpts.auth0OAuth?.domain}
CMS_AUTH0_REDIRECT_URI=${envBuilderOpts.auth0OAuth?.redirectUri}/studiocms_api/auth/auth0/callback
` : ""}
`;
}
