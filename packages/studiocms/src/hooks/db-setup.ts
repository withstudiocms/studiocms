import { defineUtility } from 'astro-integration-kit';

export const dbSetup = defineUtility('astro:db:setup')(({ extendDb }) => {
	extendDb({ configEntrypoint: '@studiocms/core/db/config' });
});

export default dbSetup;
