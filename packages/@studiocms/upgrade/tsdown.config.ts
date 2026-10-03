import { defineConfig } from 'tsdown';
import { sharedConfig } from '../../../tsdown.shared.ts';

export default defineConfig({
	...sharedConfig,
	entry: 'src/index.ts',
	deps: {
		onlyBundle: false,
	},
});
