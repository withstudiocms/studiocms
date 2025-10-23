import { StudioCMSRoutes } from 'studiocms:lib';
import { oAuthButtons } from 'studiocms:plugins/auth/providers';

export type ProviderData = {
	enabled: boolean;
	href: string;
	label: string;
	image: string;
};

export const providerData: ProviderData[] = oAuthButtons.map(
	({ enabled, image, label, safeName }) => ({
		enabled,
		href: StudioCMSRoutes.authLinks.oAuthIndex(safeName),
		label,
		image,
	})
);

export const showOAuth = providerData.some((provider) => provider.enabled);
