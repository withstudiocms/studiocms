import { afterEach, beforeEach, describe, expect, test, vi } from '@effect/vitest';
import * as allure from 'allure-js-commons';
import { closeOnOutsideClick, createWindowElement } from '../../src/utils/app-utils';
import { parentSuiteName, sharedTags } from '../test-utils.js';

// Mock DOM environment
const mockDocument = {
	createElement: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
} as Document & {
	createElement: ReturnType<typeof vi.fn>;
	addEventListener: ReturnType<typeof vi.fn>;
	removeEventListener: ReturnType<typeof vi.fn>;
};

const mockElement = {
	innerHTML: '',
	placement: '',
	closest: vi.fn(),
	dispatchEvent: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
} as EventTarget & {
	innerHTML: string;
	placement: string;
	closest: ReturnType<typeof vi.fn>;
	dispatchEvent: ReturnType<typeof vi.fn>;
	addEventListener: ReturnType<typeof vi.fn>;
	removeEventListener: ReturnType<typeof vi.fn>;
};

// Mock global objects
Object.defineProperty(global, 'document', {
	value: mockDocument,
	writable: true,
});

Object.defineProperty(global, 'CustomEvent', {
	value: vi.fn().mockImplementation((type, options) => {
		const event = {
			type,
			detail: options?.detail,
		};
		return event;
	}),
	writable: true,
});

const localSuiteName = 'app-utils Utility Function Tests';

describe(parentSuiteName, () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDocument.createElement.mockReturnValue(mockElement);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	[
		{
			content: '<div>Test content</div>',
		},
		{
			content: '',
		},
	].forEach(({ content }) => {
		test('createWindowElement should create window element with correct properties', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('createWindowElement Tests');
			await allure.tags(...sharedTags);

			await allure.step('Should create window element with correct properties', async (ctx) => {
				const result = createWindowElement(content);

				await ctx.parameter('content', content);
				await ctx.parameter('result.innerHTML', result.innerHTML);
				await ctx.parameter('result.placement', result.placement);

				expect(mockDocument.createElement).toHaveBeenCalledWith('astro-dev-toolbar-window');
				expect(result.innerHTML).toBe(content);
				expect(result.placement).toBe('bottom-center');
			});
		});
	});

	test('closeOnOutsideClick - should add app-toggled event listener', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('closeOnOutsideClick Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should add app-toggled event listener', async (ctx) => {
			const eventTarget = mockElement;
			const additionalCheck = vi.fn();

			closeOnOutsideClick(eventTarget, additionalCheck);

			await ctx.parameter(
				'eventListenersAdded',
				JSON.stringify(eventTarget.addEventListener.mock.calls, null, 2)
			);

			expect(eventTarget.addEventListener).toHaveBeenCalledWith(
				'app-toggled',
				expect.any(Function)
			);
		});
	});

	[
		{
			state: true,
		},
		{
			state: false,
		},
	].forEach(({ state }) => {
		test('closeOnOutsideClick - should handle app-toggled event', async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('closeOnOutsideClick Tests');
			await allure.tags(...sharedTags);

			await allure.step('Should handle app-toggled event', async (ctx) => {
				const eventTarget = mockElement;
				const additionalCheck = vi.fn();

				closeOnOutsideClick(eventTarget, additionalCheck);

				// Get the event listener function
				const eventListener = eventTarget.addEventListener.mock.calls[0][1];

				// Simulate app-toggled event
				const event = {
					detail: { state },
				};

				eventListener(event);

				await ctx.parameter('appToggledState', String(state));
				await ctx.parameter(
					'documentEventListeners',
					JSON.stringify(mockDocument.addEventListener.mock.calls, null, 2)
				);
				await ctx.parameter(
					'documentRemovedEventListeners',
					JSON.stringify(mockDocument.removeEventListener.mock.calls, null, 2)
				);

				expect(mockDocument.removeEventListener).toHaveBeenCalledWith(
					'click',
					expect.any(Function),
					true
				);
			});
		});
	});

	test('closeOnOutsideClock - should dispatch toggle-app event on outside click', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('closeOnOutsideClick Tests');
		await allure.tags(...sharedTags);

		await allure.step('Should dispatch toggle-app event on outside click', async (ctx) => {
			const eventTarget = mockElement;
			const additionalCheck = vi.fn();

			closeOnOutsideClick(eventTarget, additionalCheck);

			// Get the event listener function
			const eventListener = eventTarget.addEventListener.mock.calls[0][1];

			// Simulate app-toggled event with state true
			eventListener({ detail: { state: true } });

			// Get the click event listener
			const clickListener = mockDocument.addEventListener.mock.calls[0][1];

			// Mock target element
			const targetElement = {
				closest: vi.fn().mockReturnValue(null), // Not inside astro-dev-toolbar
			};

			// Simulate click event
			const clickEvent = {
				target: targetElement,
			};

			clickListener(clickEvent);

			await ctx.parameter('targetElementClosestCall', String(targetElement.closest.mock.calls));
			await ctx.parameter(
				'eventTargetDispatchEventCalls',
				JSON.stringify(eventTarget.dispatchEvent.mock.calls, null, 2)
			);

			expect(eventTarget.dispatchEvent).toHaveBeenCalled();
			const dispatchedEvent = eventTarget.dispatchEvent.mock.calls[0][0];
			// The CustomEvent constructor was called, check the arguments
			expect(global.CustomEvent).toHaveBeenCalledWith('toggle-app', {
				detail: { state: false },
			});
		});
	});

	test('closeOnOutsideClick - should not dispatch toggle-app event when clicking inside astro-dev-toolbar or additionalCheck returns true', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('closeOnOutsideClick Tests');
		await allure.tags(...sharedTags);

		await allure.step(
			'should not dispatch toggle-app event when clicking inside astro-dev-toolbar or additionalCheck returns true',
			async (ctx) => {
				const eventTarget = mockElement;
				const additionalCheck = vi.fn().mockReturnValue(true);

				closeOnOutsideClick(eventTarget, additionalCheck);

				// Get the event listener function
				const eventListener = eventTarget.addEventListener.mock.calls[0][1];

				// Simulate app-toggled event with state true
				eventListener({ detail: { state: true } });

				// Get the click event listener
				const clickListener = mockDocument.addEventListener.mock.calls[0][1];

				// Mock target element
				const targetElement = {
					closest: vi.fn().mockReturnValue(null), // Not inside astro-dev-toolbar
				};

				// Simulate click event
				const clickEvent = {
					target: targetElement,
				};

				clickListener(clickEvent);

				await ctx.parameter('targetElementClosestCall', String(targetElement.closest.mock.calls));
				await ctx.parameter('additionalCheckCalls', String(additionalCheck.mock.calls));
				await ctx.parameter(
					'eventTargetDispatchEventCalls',
					JSON.stringify(eventTarget.dispatchEvent.mock.calls, null, 2)
				);

				expect(additionalCheck).toHaveBeenCalledWith(targetElement);
				expect(eventTarget.dispatchEvent).not.toHaveBeenCalled();
			}
		);
	});
});
