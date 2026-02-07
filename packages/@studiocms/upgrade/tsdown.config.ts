import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/index.ts',
	clean: true,
	treeshake: true,
	inlineOnly: false,
});
