import { toast } from 'studiocms:ui/components';

export async function formListener(
	event: SubmitEvent,
	form: HTMLFormElement,
	type: 'login' | 'register'
) {
	event.preventDefault();

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
		window.location.reload();
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
