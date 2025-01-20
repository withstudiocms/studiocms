import { defineUtility } from 'astro-integration-kit';
import webVitalDtsFile from '../stubs/webVitals.js';

export const configDone = defineUtility('astro:config:done')(({ injectTypes }) => {
	injectTypes(webVitalDtsFile);
});

export default configDone;
