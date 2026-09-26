/**
 * A collection of positive affirmation messages displayed to users upon successful operations.
 *
 * These celebration messages are randomly selected to provide varied, encouraging feedback
 * during upgrade processes or successful command executions.
 *
 * @example
 * ```ts
 * const randomMessage = celebrations[Math.floor(Math.random() * celebrations.length)];
 * console.log(randomMessage); // Output: "Awesome." (or any other message)
 * ```
 */
export const celebrations = [
	'Beautiful.',
	'Excellent!',
	'Sweet!',
	'Nice!',
	'Huzzah!',
	'Success.',
	'Nice.',
	'Wonderful.',
	'Lovely!',
	"Lookin' good.",
	'Awesome.',
] as const;

/**
 * Array of success messages displayed when all integrations are up-to-date.
 *
 * These messages are randomly selected to provide variety in user feedback
 * when the upgrade check determines that no updates are needed.
 *
 * @remarks
 * Messages should maintain a positive and reassuring tone to confirm
 * that the user's installation is current.
 *
 * @example
 * ```typescript
 * const message = done[Math.floor(Math.random() * done.length)];
 * console.log(message); // "You're on the latest and greatest."
 * ```
 */
export const done = [
	"You're on the latest and greatest.",
	'Your integrations are up-to-date.',
	'Everything is current.',
	'Everything is up to date.',
	'Integrations are all up to date.',
	'Everything is on the latest and greatest.',
	'Integrations are up to date.',
] as const;

/**
 * Array of farewell messages displayed to users after completing StudioCMS operations.
 *
 * Each message is a friendly goodbye phrase that can be randomly selected
 * to provide a positive user experience when exiting or completing tasks.
 *
 * @example
 * ```ts
 * const randomMessage = bye[Math.floor(Math.random() * bye.length)];
 * console.log(randomMessage);
 * ```
 */
export const bye = [
	'Thanks for using StudioCMS!',
	"Can't wait to see what you build.",
	'Good luck out there.',
	'See you around!',
] as const;
