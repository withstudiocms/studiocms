import { defineUtility } from 'astro-integration-kit';
import componentsDtsFileOutput from '../stubs/components.js';
import coreDtsFileOutput from '../stubs/core.js';
import i18nDTSOutput from '../stubs/i18n-dts.js';
import libDtsFileOutput from '../stubs/lib.js';
import sdkDtsFile from '../stubs/sdk.js';

export const configDone = defineUtility('astro:config:done')(({ injectTypes }) => {
	// Inject the DTS File
	injectTypes(componentsDtsFileOutput);
	injectTypes(coreDtsFileOutput);
	injectTypes(i18nDTSOutput);
	injectTypes(sdkDtsFile);
	injectTypes(libDtsFileOutput);
});

export default configDone;
