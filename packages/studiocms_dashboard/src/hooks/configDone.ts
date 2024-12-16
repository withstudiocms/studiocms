import { defineUtility } from 'astro-integration-kit';
import webVitalDtsFile from '../stubs/webVitals';

export const configDone = defineUtility('astro:config:done')(({ injectTypes }) => {
	injectTypes(webVitalDtsFile);
});

export default configDone;
