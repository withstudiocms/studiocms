import { Schema } from '../../../../../effect.js';

/**
 * Represents a user authenticated via Auth0.
 *
 * @property {string} sub - The unique identifier for the user (subject).
 * @property {string} name - The full name of the user.
 * @property {string} email - The email address of the user.
 * @property {string} picture - The URL to the user's profile picture.
 * @property {string} nickname - The user's nickname.
 */
export class Auth0User extends Schema.Class<Auth0User>('Auth0User')({
	sub: Schema.String,
	name: Schema.String,
	email: Schema.String,
	picture: Schema.String,
	nickname: Schema.String,
}) {}

/**
 * Represents a Discord user's profile information.
 *
 * @property id - The unique identifier for the Discord user.
 * @property avatar - The user's avatar hash.
 * @property username - The user's Discord username.
 * @property global_name - The user's global display name.
 * @property email - The user's email address.
 */
export class DiscordUser extends Schema.Class<DiscordUser>('DiscordUser')({
	id: Schema.String,
	avatar: Schema.String,
	username: Schema.String,
	global_name: Schema.String,
	email: Schema.String,
}) {}

/**
 * Represents a GitHub user profile as returned by the GitHub API.
 *
 * @property id - The unique identifier for the user.
 * @property html_url - The URL to the user's GitHub profile.
 * @property login - The user's GitHub username.
 * @property avatar_url - The URL to the user's avatar image.
 * @property name - The user's display name.
 * @property blog - The user's blog URL.
 * @property email - The user's public email address.
 */
export class GitHubUser extends Schema.Class<GitHubUser>('GitHubUser')({
	id: Schema.Number,
	html_url: Schema.String,
	login: Schema.String,
	avatar_url: Schema.String,
	name: Schema.String,
	blog: Schema.String,
	email: Schema.String,
}) {}

/**
 * Represents a user authenticated via Google OAuth.
 *
 * @property sub - The unique identifier for the user (subject).
 * @property picture - The URL of the user's profile picture.
 * @property name - The full name of the user.
 * @property email - The user's email address.
 */
export class GoogleUser extends Schema.Class<GoogleUser>('GoogleUser')({
	sub: Schema.String,
	picture: Schema.String,
	name: Schema.String,
	email: Schema.String,
}) {}
