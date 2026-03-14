import { StudioCMSRoutes } from 'studiocms:lib';
import { oAuthButtons } from 'studiocms:plugins/auth/providers';

/**
 * Data for each OAuth provider button.
 */
export type ProviderData = {
	enabled: boolean;
	href: string;
	label: string;
	image: string;
};

/**
 * Array of OAuth provider data for rendering buttons.
 */
export const providerData: ProviderData[] = oAuthButtons.map(
	({ enabled, image, label, safeName }) => ({
		enabled,
		href: StudioCMSRoutes.authLinks.oAuthIndex(safeName),
		label,
		image,
	})
);

/**
 * Whether to show any OAuth buttons.
 */
export const showOAuth = providerData.some((provider) => provider.enabled);
