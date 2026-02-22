import { defineConfig } from 'tsdown';
import { sharedConfig } from '../../../tsdown.shared';

export default defineConfig({
	...sharedConfig,
	unbundle: true,
	entry: 'src/**/**.ts',
	copy: [{ from: 'src/styles/**/*.css', to: 'dist', flatten: false }],
});
