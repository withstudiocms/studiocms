// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formListener } from '../../../../src/components/auth/component-scripts/formListener';

// mock global fetch
beforeEach(() => {
	global.fetch = vi.fn().mockResolvedValue({
		ok: true,
		json: async () => ({ message: 'Success' }),
	});
});

describe('formListener', () => {
	let form: HTMLFormElement;
	let event: SubmitEvent;

	beforeEach(() => {
		document.body.innerHTML = `
            <form id="test-form" action="/api/auth" method="POST">
                <input name="password" value="pass123" />
                <input name="confirm-password" value="pass123" />
            </form>
        `;
		form = document.getElementById('test-form') as HTMLFormElement;
		event = new SubmitEvent('submit', { bubbles: true, cancelable: true });
	});

	it('shows toast and returns if passwords do not match on register', async () => {
		// biome-ignore lint/style/noNonNullAssertion: allowed in tests
		form.querySelector<HTMLInputElement>('input[name="confirm-password"]')!.value = 'different';
		const toast = vi.fn();
		await formListener(event, form, 'register', toast);
		expect(toast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Passwords do not match!',
				type: 'danger',
			})
		);
	});

	it('shows error toast if response is not ok', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({
				error: {
					title: 'Auth failed',
					description: 'Invalid credentials',
				},
			}),
		});
		const toast = vi.fn();
		await formListener(event, form, 'login', toast);
		expect(toast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Auth failed',
				type: 'danger',
				description: 'Invalid credentials',
			})
		);
	});

	it('calls fetch with correct arguments and shows success toast on login', async () => {
		const toast = vi.fn();
		const reload = vi.fn();
		await formListener(event, form, 'login', toast, reload);
		expect(global.fetch).toHaveBeenCalledWith(form.action, {
			method: form.method,
			body: expect.any(FormData),
		});
		expect(toast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Login successful!',
				type: 'success',
				description: 'Redirecting...',
			})
		);
		expect(reload).toHaveBeenCalled();
	});

	it('calls fetch with correct arguments and shows success toast on register', async () => {
		const toast = vi.fn();
		const reload = vi.fn();
		await formListener(event, form, 'register', toast, reload);
		expect(global.fetch).toHaveBeenCalledWith(form.action, {
			method: form.method,
			body: expect.any(FormData),
		});
		expect(toast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Registration successful!',
				type: 'success',
				description: 'Redirecting...',
			})
		);
		expect(reload).toHaveBeenCalled();
	});

	it('prevents default event behavior', async () => {
		const preventDefault = vi.fn();
		const reload = vi.fn();
		const customEvent = { ...event, preventDefault } as SubmitEvent;
		const toast = vi.fn();
		await formListener(customEvent, form, 'login', toast, reload);
		expect(preventDefault).toHaveBeenCalled();
	});
});
