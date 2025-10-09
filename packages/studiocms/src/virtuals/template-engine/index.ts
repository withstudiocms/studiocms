/* v8 ignore start */
/*
 * File ignored in v8 migration because it uses a vite virtual module import.
 * This will be manually migrated later.
 */
import { SDKCore } from 'studiocms:sdk';
import TemplateEngine from '@withstudiocms/template-lang';
import { Effect } from '../../effect.js';
import defaultTemplates from './default-templates.js';

export type EngineContext = {
	site: {
		title: string;
		description?: string;
		icon?: string;
	};
	data: Record<string, string>;
};

const engine = new TemplateEngine({ strict: true });

/**
 * The template engine provides functionality to manage and render email templates.
 *
 * It allows fetching, updating, and rendering templates with dynamic context data.
 */
export const templateEngine = Effect.gen(function* () {
	const sdk = yield* SDKCore;

	// Ensure the template configuration is initialized and available
	let config = yield* sdk.CONFIG.templateConfig.get();
	if (!config) {
		config = yield* sdk.CONFIG.templateConfig.init(defaultTemplates);
	}
	if (!config) {
		return yield* Effect.fail(new Error('Failed to initialize template configuration.'));
	}

	// Extract the templates from the configuration data
	const { _config_version, ...templates } = config.data;
	type Templates = typeof templates;
	type TemplateKeys = keyof Templates;

	const templateKeys = Object.keys(templates) as TemplateKeys[];

	return {
		/**
		 * Retrieves the specified email template.
		 *
		 * @param key - The key of the template to retrieve.
		 * @returns The specified email template.
		 */
		getTemplate: (key: TemplateKeys) => templates[key],

		/**
		 * Retrieves the default email template.
		 *
		 * @param key - The key of the default template to retrieve.
		 * @returns The default email template.
		 */
		getDefaultTemplate: (key: TemplateKeys) => defaultTemplates[key],

		availableTemplates: templateKeys,

		allTemplates: templates,

		defaultTemplates,

		/**
		 * Updates the email templates with new templates.
		 *
		 * @param newTemplates - An object containing the new templates to update.
		 */
		updateTemplates: (newTemplates: Templates) => sdk.CONFIG.templateConfig.update(newTemplates),

		/**
		 * Renders the specified email template with the provided context data.
		 *
		 * @param key - The key of the template to render.
		 * @param context - The context data to use for rendering the template.
		 * @returns The rendered email content.
		 */
		render: (key: TemplateKeys, context: EngineContext) => {
			const template = templates[key] || defaultTemplates[key];
			return Effect.try({
				try: () => engine.render(template, context),
				catch: (error) =>
					new Error(`Failed to render template "${key}": ${(error as Error).message}`),
			});
		},
	} as const;
});

export default templateEngine;
/* v8 ignore end */
