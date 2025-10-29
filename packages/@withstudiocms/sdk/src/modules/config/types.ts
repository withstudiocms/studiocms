import type { StudioCMSDynamicConfigSettings } from '@withstudiocms/kysely/tables';

/**
 * Represents the dynamic configuration settings type for StudioCMS.
 *
 * This type is inferred from the shape of `StudioCMSDynamicConfigSettings`,
 * allowing for strong typing and IntelliSense support wherever the dynamic
 * configuration settings are used.
 *
 * @see StudioCMSDynamicConfigSettings
 */
export type DynamicConfigSettings = typeof StudioCMSDynamicConfigSettings;

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
 * Base interface for dynamic configuration objects in StudioCMS.
 *
 * @property _config_version - The version identifier for the configuration schema.
 */
export interface StudioCMSDynamicConfigBase {
	_config_version: string;
}

/**
 * A version of a dynamic StudioCMS configuration with the internal version field removed.
 *
 * This utility type produces a configuration type based on `T` (which must extend
 * `StudioCMSDynamicConfigBase`) but omits the internal `_config_version` property.
 * It is intended for use when exposing or working with the final, consumer-facing
 * shape of configuration where the internal version metadata should not be present.
 *
 * @template T - The dynamic configuration type extending `StudioCMSDynamicConfigBase`.
 *
 * @remarks
 * Preserves all other properties of `T`.
 */
export type ConfigFinal<T extends StudioCMSDynamicConfigBase> = Omit<T, '_config_version'>;

/**
 * Represents the site configuration type for StudioCMS.
 *
 * This interface extends the base dynamic configuration and includes various
 * properties related to site settings such as description, title, images,
 * mailer options, and more.
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
 * Represents the mailer configuration type for StudioCMS.
 *
 * This interface extends the base dynamic configuration and includes various
 * properties related to mail server settings such as host, port, security,
 * authentication, and default sender information.
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
 * Represents the notification settings configuration type for StudioCMS.
 *
 * This interface extends the base dynamic configuration and includes various
 * boolean properties that determine the behavior of email verification and
 * user verification requirements.
 */
export interface StudioCMSNotificationSettings extends StudioCMSDynamicConfigBase {
	emailVerification?: boolean | undefined;
	requireAdminVerification?: boolean | undefined;
	requireEditorVerification?: boolean | undefined;
	oAuthBypassVerification?: boolean | undefined;
}

/**
 * Represents the template configuration type for StudioCMS.
 *
 * This interface extends the base dynamic configuration and includes optional
 * properties for various email templates used in notifications, password resets,
 * user invitations, and email verification.
 */
export interface StudioCMSTemplateConfig extends StudioCMSDynamicConfigBase {
	notifications?: string;
	passwordReset?: string;
	userInvite?: string;
	verifyEmail?: string;
}
