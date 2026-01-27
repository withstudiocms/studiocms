import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/**/*.ts',
	clean: true,
	treeshake: true,
	unbundle: true,
});
