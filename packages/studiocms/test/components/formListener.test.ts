// @vitest-environment jsdom
import { beforeEach, describe, expect, vi } from 'vitest';
import { formListener } from '../../src/frontend/scripts/auth/formListener';
import { allureTester } from '../fixtures/allureTester';
import { parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Form Listener tests';

// mock global fetch
beforeEach(() => {
	global.fetch = vi.fn().mockResolvedValue({
		ok: true,
		json: async () => ({ message: 'Success' }),
	});
});

describe(parentSuiteName, () => {
	let form: HTMLFormElement;
	let event: SubmitEvent;
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

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

	test('shows toast and returns if passwords do not match on register', async ({ setupAllure }) => {
		await setupAllure({
			subSuiteName: 'formListener password mismatch test',
			tags: [...sharedTags, 'component:form-listener', 'formListener:password-mismatch'],
		});

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

	test('shows error toast if response is not ok', async ({ setupAllure }) => {
		await setupAllure({
			subSuiteName: 'formListener error response test',
			tags: [...sharedTags, 'component:form-listener', 'formListener:error-response'],
		});

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

	test('calls fetch with correct arguments and shows success toast on login', async ({
		setupAllure,
	}) => {
		await setupAllure({
			subSuiteName: 'formListener login success test',
			tags: [...sharedTags, 'component:form-listener', 'formListener:login-success'],
		});

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

	test('calls fetch with correct arguments and shows success toast on register', async ({
		setupAllure,
	}) => {
		await setupAllure({
			subSuiteName: 'formListener register success test',
			tags: [...sharedTags, 'component:form-listener', 'formListener:register-success'],
		});

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

	test('prevents default event behavior', async ({ setupAllure }) => {
		await setupAllure({
			subSuiteName: 'formListener prevent default test',
			tags: [...sharedTags, 'component:form-listener', 'formListener:prevent-default'],
		});
		const preventDefault = vi.fn();
		const reload = vi.fn();
		const customEvent = { ...event, preventDefault } as SubmitEvent;
		const toast = vi.fn();
		await formListener(customEvent, form, 'login', toast, reload);
		expect(preventDefault).toHaveBeenCalled();
	});
});
