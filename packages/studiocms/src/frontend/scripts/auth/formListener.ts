/**
 * This tool is used by Auth Login pages
 */

import { toast as uiToast } from 'studiocms:ui/components/toaster';
import type { ToastProps } from '@studiocms/ui/types';

/**
 * Handles form submission events for login and registration forms.
 *
 * @param event - The submit event triggered by the form submission.
 * @param form - The HTML form element being submitted.
 * @param type - The type of form being submitted, either 'login' or 'register'.
 *
 * @remarks
 * - Prevents the default form submission behavior.
 * - For registration forms, checks if the password and confirm password fields match.
 * - Displays a toast notification if the passwords do not match.
 * - Submits the form data using the fetch API.
 * - Displays a success toast notification and reloads the page if the submission is successful.
 * - Displays an error toast notification if the submission fails.
 */
export async function formListener(
	event: SubmitEvent,
	form: HTMLFormElement,
	type: 'login' | 'register',
	toast: (props: ToastProps) => void = uiToast,
	/* v8 ignore start */
	reload: () => void = () => {
		if (typeof window !== 'undefined') {
			window.location.reload();
		}
	}
	/* v8 ignore stop */
) {
	event.preventDefault();

	/* v8 ignore start */
	if (type === 'register') {
		const password = form.querySelector('input[name="password"]') as HTMLInputElement;
		const confirmPassword = form.querySelector(
			'input[name="confirm-password"]'
		) as HTMLInputElement;

		if (password.value !== confirmPassword.value) {
			toast({
				title: 'Passwords do not match!',
				type: 'danger',
				description: 'Please make sure your passwords match.',
				closeButton: true,
				persistent: true,
			});
			return;
		}
	}
	/* v8 ignore stop */

	const response = await fetch(form.action, {
		method: form.method,
		body: new FormData(form),
	});
	if (response.ok) {
		toast({
			title: `${type === 'login' ? 'Login' : 'Registration'} successful!`,
			type: 'success',
			description: 'Redirecting...',
		});
		reload();
	} else {
		const {
			error: { title, description },
		} = await response.json();
		toast({
			title,
			type: 'danger',
			description,
			closeButton: true,
			persistent: true,
		});
	}
}
