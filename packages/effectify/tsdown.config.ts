import { defineConfig } from 'tsdown';
import { noBundleConfig, sharedConfig } from '../../tsdown.shared.ts';

export default defineConfig({
	...sharedConfig,
	...noBundleConfig,
	entry: 'src/**/*.ts',
});
