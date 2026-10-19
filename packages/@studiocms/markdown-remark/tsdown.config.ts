import { defineConfig } from 'tsdown';
import { noBundleConfig, sharedConfig, virtualModuleFix } from '../../../tsdown.shared.ts';

export default defineConfig({
	...sharedConfig,
	...virtualModuleFix,
	...noBundleConfig,
	entry: 'src/**/**.ts',
});
