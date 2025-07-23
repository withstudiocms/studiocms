/**
 * Enum representing supported authentication providers.
 *
 * @remarks
 * Used to specify the provider for authentication flows.
 *
 * @enum {string}
 * @property {Provider.GOOGLE}  Google authentication provider.
 * @property {Provider.GITHUB}  GitHub authentication provider.
 * @property {Provider.DISCORD} Discord authentication provider.
 * @property {Provider.AUTH0}   Auth0 authentication provider.
 */
export enum Provider {
	GOOGLE = 'google',
	GITHUB = 'github',
	DISCORD = 'discord',
	AUTH0 = 'auth0',
}
