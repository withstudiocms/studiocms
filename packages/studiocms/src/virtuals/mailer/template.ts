import { notification, passwordReset, userInvite, verifyEmail } from './templates/index.js';

const templates = {
	verifyEmail,
	notification,
	passwordReset,
	userInvite,
};

type Templates = typeof templates;

type TemplateKeys = keyof Templates;

/**
 * Retrieves the specified email template.
 *
 * @param template - The template to retrieve.
 * @returns The specified email template.
 */
export function getTemplate<T extends TemplateKeys>(template: T): Templates[T] {
	return templates[template];
}
