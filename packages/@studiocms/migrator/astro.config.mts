import db from '@astrojs/db';
import node from '@astrojs/node';
import ui from '@studiocms/ui';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [db(), ui()],
});
