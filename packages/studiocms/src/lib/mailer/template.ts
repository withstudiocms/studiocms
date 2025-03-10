import { verifyEmail } from './templates/index.js';

const currentTemplates = ['verifyEmail'] as const;

type Template = (typeof currentTemplates)[number];

/**
 * Retrieves the specified email template.
 *
 * @param template - The template to retrieve.
 * @returns The specified email template.
 */
export function getTemplate(template: Template) {
	switch (template) {
		case 'verifyEmail':
			return verifyEmail;
	}
}
