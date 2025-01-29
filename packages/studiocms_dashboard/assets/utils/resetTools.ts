import { StudioCMSRoutes } from 'studiocms:lib';

const dashboardIndex = StudioCMSRoutes.mainLinks.dashboardIndex;

export function generateResetLink(token: {
	id: string;
	userId: string;
	token: string;
}) {
	return `${dashboardIndex}/reset-password?userid=${token.userId}token=${token.token}bucketid=${token.id}`;
}
