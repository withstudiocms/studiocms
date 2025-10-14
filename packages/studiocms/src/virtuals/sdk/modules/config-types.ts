import type {
	tsDynamicConfigSettings,
	tsMailerConfig,
	tsNotificationSettings,
	tsSiteConfig,
} from '../tables.js';

/**
 * Represents the inferred selection type for dynamic configuration settings.
 *
 * This type is derived from the `$inferSelect` property of `tsDynamicConfigSettings`,
 * and is typically used to describe the shape of a dynamic configuration entry
 * as it would be selected from the database or configuration source.
 */
export type RawDynamicConfigEntry = typeof tsDynamicConfigSettings.$inferSelect;
export type RawDynamicConfigInsert = typeof tsDynamicConfigSettings.$inferInsert;

/**
 * Represents a dynamic configuration entry with a unique identifier and associated data.
 *
 * @template T - The type of the data stored in the configuration entry.
 * @property id - A unique string identifier for the configuration entry.
 * @property data - The configuration data of type T.
 */
export type DynamicConfigEntry<T> = {
	id: string;
	data: T;
};

/**
 * Represents the legacy site configuration type, inferred from the shape of `tsSiteConfig`.
 *
 * This type is useful for maintaining compatibility with older site configuration structures.
 *
 * @see tsSiteConfig
 */
export type LegacySiteConfig = typeof tsSiteConfig;

/**
 * Represents the type of the legacy mailer configuration object.
 *
 * This type is inferred from the shape of `tsMailerConfig`, allowing for strong typing
 * and IntelliSense support wherever the legacy mailer configuration is used.
 *
 * @see tsMailerConfig
 */
export type LegacyMailerConfig = typeof tsMailerConfig;

/**
 * Represents the type of the legacy notification settings object.
 *
 * This type is inferred from the shape of `tsNotificationSettings`.
 * It is used to ensure compatibility with legacy notification settings
 * throughout the codebase.
 *
 * @see tsNotificationSettings
 */
export type LegacyNotificationSettings = typeof tsNotificationSettings;

/**
 * Represents the union of legacy configuration table types.
 *
 * @remarks
 * This type is used to refer to any of the legacy configuration tables
 * that may be present in the system, including site configuration,
 * mailer configuration, and notification settings.
 *
 * @see LegacySiteConfig
 * @see LegacyMailerConfig
 * @see LegacyNotificationSettings
 */
export type LegacyTables = LegacySiteConfig | LegacyMailerConfig | LegacyNotificationSettings;

/**
 * Base interface for dynamic configuration objects in StudioCMS.
 *
 * @property _config_version - The version identifier for the configuration schema.
 */
export interface StudioCMSDynamicConfigBase {
	_config_version: string;
}

export type ConfigFinal<T extends StudioCMSDynamicConfigBase> = Omit<T, '_config_version'>;

/**
 * Represents the configuration options for a StudioCMS site.
 *
 * @extends StudioCMSDynamicConfigBase
 *
 * @property {string} description - A brief description of the site.
 * @property {string} title - The title of the site.
 * @property {string | null | undefined} [defaultOgImage] - The default Open Graph image URL for social sharing.
 * @property {string | null | undefined} [siteIcon] - The URL or path to the site's icon.
 * @property {string | undefined} [loginPageBackground] - The background image or color for the login page.
 * @property {string | null | undefined} [loginPageCustomImage] - A custom image for the login page.
 * @property {boolean | undefined} [enableDiffs] - Whether to enable content diffs.
 * @property {number | undefined} [diffPerPage] - The number of diffs to display per page.
 * @property {string[]} [gridItems] - List of grid item identifiers for the site layout.
 * @property {boolean | undefined} [enableMailer] - Whether to enable the mailer functionality.
 * @property {boolean | undefined} [hideDefaultIndex] - Whether to hide the default index page.
 */
export interface StudioCMSSiteConfig extends StudioCMSDynamicConfigBase {
	description: string;
	title: string;
	defaultOgImage?: string | null | undefined;
	siteIcon?: string | null | undefined;
	loginPageBackground?: string | undefined;
	loginPageCustomImage?: string | null | undefined;
	enableDiffs?: boolean | undefined;
	diffPerPage?: number | undefined;
	gridItems?: string[];
	enableMailer?: boolean | undefined;
	hideDefaultIndex?: boolean | undefined;
}

/**
 * Configuration options for the StudioCMS mailer module.
 *
 * @extends StudioCMSDynamicConfigBase
 *
 * @property host - The hostname or IP address of the mail server.
 * @property port - The port number to connect to the mail server.
 * @property secure - Whether to use a secure connection (TLS/SSL).
 * @property proxy - Optional. Proxy server URL to use for outgoing mail connections.
 * @property auth_user - Optional. Username for mail server authentication.
 * @property auth_pass - Optional. Password for mail server authentication.
 * @property tls_rejectUnauthorized - Optional. Whether to reject unauthorized TLS certificates.
 * @property tls_servername - Optional. Server name for TLS verification.
 * @property default_sender - The default email address to use as the sender.
 */
export interface StudioCMSMailerConfig extends StudioCMSDynamicConfigBase {
	host: string;
	port: number;
	secure: boolean;
	proxy?: string | null | undefined;
	auth_user?: string | null | undefined;
	auth_pass?: string | null | undefined;
	tls_rejectUnauthorized?: boolean | null | undefined;
	tls_servername?: string | null | undefined;
	default_sender: string;
}

/**
 * Represents the notification settings configuration for StudioCMS.
 * Extends the base dynamic configuration interface.
 *
 * @property emailVerification - Optional. If true, enables email verification for users.
 * @property requireAdminVerification - Optional. If true, requires admin verification for certain actions.
 * @property requireEditorVerification - Optional. If true, requires editor verification for certain actions.
 * @property oAuthBypassVerification - Optional. If true, allows OAuth users to bypass verification.
 */
export interface StudioCMSNotificationSettings extends StudioCMSDynamicConfigBase {
	emailVerification?: boolean | undefined;
	requireAdminVerification?: boolean | undefined;
	requireEditorVerification?: boolean | undefined;
	oAuthBypassVerification?: boolean | undefined;
}

export interface StudioCMSTemplateConfig extends StudioCMSDynamicConfigBase {
	notifications?: string;
	passwordReset?: string;
	userInvite?: string;
	verifyEmail?: string;
}
