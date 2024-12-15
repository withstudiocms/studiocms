import { defineUtility } from 'astro-integration-kit';
import componentsDtsFileOutput from '../stubs/components';
import coreDtsFileOutput from '../stubs/core';
import i18nDTSOutput from '../stubs/i18n-dts';
import libDtsFileOutput from '../stubs/lib';
import sdkDtsFile from '../stubs/sdk';

export const configDone = defineUtility('astro:config:done')(({ injectTypes }) => {
	// Inject the DTS File
	injectTypes(componentsDtsFileOutput);
	injectTypes(coreDtsFileOutput);
	injectTypes(i18nDTSOutput);
	injectTypes(sdkDtsFile);
	injectTypes(libDtsFileOutput);
});

export default configDone;
