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
	const templates = config.data;
	type Templates = Omit<typeof templates, '_config_version'>;
	type TemplateKeys = keyof Templates;

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

// Examples of context data:

// Password reset email
// {
//   site: {
//     title: "My Awesome App",
//     description: "The best app in the universe",
//     icon: "https://example.com/icon.png"
//   },
//   data: {
//     link: "https://example.com/reset-password?token=abc123",
//   },
// }

// Notification email
// {
//   site: {
//     title: "My Awesome App",
//     description: "The best app in the universe",
//     icon: "https://example.com/icon.png"
//   },
//   data: {
//     title: "Your report is ready",
//     message: "Click the link below to download your report.",
//   },
// }

// User invite email
// {
//   site: {
//     title: "My Awesome App",
//     description: "The best app in the universe",
//     icon: "https://example.com/icon.png"
//   },
//   data: {
//     link: "https://example.com/set-password?token=abc123",
//   },
// }

// Email verification email
// {
//   site: {
//     title: "My Awesome App",
//     description: "The best app in the universe",
//     icon: "https://example.com/icon.png"
//   },
//   data: {
//     link: "https://example.com/verify-email?token=abc123",
//   },
// }
