import { createSimplePathRouter } from '#frontend/utils/rest-router.js';

const router = {
	'forgot-password': {},
	login: {},
	logout: {},
	register: {},
};

export const ALL = createSimplePathRouter('studiocms:auth', router);
