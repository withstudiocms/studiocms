import { defineUtility } from 'astro-integration-kit';
import authLibDTS from '../stubs/auth-lib';
import authScriptsDTS from '../stubs/auth-scripts';
import authUtilsDTS from '../stubs/auth-utils';

export const configDone = defineUtility('astro:config:done')(({ injectTypes }) => {
	// Inject Types
	injectTypes(authLibDTS);
	injectTypes(authUtilsDTS);
	injectTypes(authScriptsDTS);
});

export default configDone;
