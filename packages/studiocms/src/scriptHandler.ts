import fs from 'node:fs';
import { createResolver, defineUtility } from 'astro-integration-kit';
import type { Script } from './types.js';

type Options = {
	dbStartPage: boolean;
	injectQuickActionsMenu: boolean;
	pageTypeOptions: {
		markdown: {
			flavor: 'astro' | 'studiocms';
		};
	};
	extraScripts?: Script[];
};

// Resolver Function
const { resolve } = createResolver(import.meta.url);

export const scriptHandler = defineUtility('astro:config:setup')((params, options: Options) => {
	const { injectScript } = params;

	const { dbStartPage, injectQuickActionsMenu, pageTypeOptions, extraScripts } = options;

	const scripts: Script[] = [
		{
			content: 'import "studiocms:renderer/markdown-remark/css";',
			stage: 'page-ssr',
			enabled: pageTypeOptions.markdown.flavor === 'studiocms',
		},
		{
			content: fs.readFileSync(resolve('./components/user-quick-tools.js'), 'utf-8'),
			stage: 'page',
			enabled: injectQuickActionsMenu && !dbStartPage,
		},
	];

	if (extraScripts && extraScripts.length > 0) {
		scripts.push(...extraScripts);
	}

	// Inject Scripts
	for (const { enabled, stage, content } of scripts) {
		if (enabled) injectScript(stage, content);
	}
});
