import { afterEach, beforeEach, describe, expect, it, vi } from '@effect/vitest';
import { closeOnOutsideClick, createWindowElement } from '../../src/utils/app-utils.js';

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

describe('app-utils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDocument.createElement.mockReturnValue(mockElement);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('createWindowElement', () => {
		it('should create window element with correct properties', () => {
			const content = '<div>Test content</div>';
			const result = createWindowElement(content);

			expect(mockDocument.createElement).toHaveBeenCalledWith('astro-dev-toolbar-window');
			expect(result.innerHTML).toBe(content);
			expect(result.placement).toBe('bottom-center');
		});

		it('should handle empty content', () => {
			const result = createWindowElement('');

			expect(mockDocument.createElement).toHaveBeenCalledWith('astro-dev-toolbar-window');
			expect(result.innerHTML).toBe('');
			expect(result.placement).toBe('bottom-center');
		});
	});

	describe('closeOnOutsideClick', () => {
		it('should add app-toggled event listener', () => {
			const eventTarget = mockElement;
			const additionalCheck = vi.fn();

			closeOnOutsideClick(eventTarget, additionalCheck);

			expect(eventTarget.addEventListener).toHaveBeenCalledWith(
				'app-toggled',
				expect.any(Function)
			);
		});

		it('should handle app-toggled event with state true', () => {
			const eventTarget = mockElement;
			const additionalCheck = vi.fn();

			closeOnOutsideClick(eventTarget, additionalCheck);

			// Get the event listener function
			const eventListener = eventTarget.addEventListener.mock.calls[0][1];

			// Simulate app-toggled event with state true
			const event = {
				detail: { state: true },
			};

			eventListener(event);

			expect(mockDocument.addEventListener).toHaveBeenCalledWith(
				'click',
				expect.any(Function),
				true
			);
		});

		it('should handle app-toggled event with state false', () => {
			const eventTarget = mockElement;
			const additionalCheck = vi.fn();

			closeOnOutsideClick(eventTarget, additionalCheck);

			// Get the event listener function
			const eventListener = eventTarget.addEventListener.mock.calls[0][1];

			// Simulate app-toggled event with state false
			const event = {
				detail: { state: false },
			};

			eventListener(event);

			expect(mockDocument.removeEventListener).toHaveBeenCalledWith(
				'click',
				expect.any(Function),
				true
			);
		});

		it('should dispatch toggle-app event when clicking outside', () => {
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

			expect(eventTarget.dispatchEvent).toHaveBeenCalled();
			const dispatchedEvent = eventTarget.dispatchEvent.mock.calls[0][0];
			// The CustomEvent constructor was called, check the arguments
			expect(global.CustomEvent).toHaveBeenCalledWith('toggle-app', {
				detail: { state: false },
			});
		});

		it('should not dispatch toggle-app event when clicking inside astro-dev-toolbar', () => {
			const eventTarget = mockElement;
			const additionalCheck = vi.fn();

			closeOnOutsideClick(eventTarget, additionalCheck);

			// Get the event listener function
			const eventListener = eventTarget.addEventListener.mock.calls[0][1];

			// Simulate app-toggled event with state true
			eventListener({ detail: { state: true } });

			// Get the click event listener
			const clickListener = mockDocument.addEventListener.mock.calls[0][1];

			// Mock target element inside astro-dev-toolbar
			const targetElement = {
				closest: vi.fn().mockReturnValue({}), // Inside astro-dev-toolbar
			};

			// Simulate click event
			const clickEvent = {
				target: targetElement,
			};

			clickListener(clickEvent);

			expect(eventTarget.dispatchEvent).not.toHaveBeenCalled();
		});

		it('should not dispatch toggle-app event when additionalCheck returns true', () => {
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

			expect(additionalCheck).toHaveBeenCalledWith(targetElement);
			expect(eventTarget.dispatchEvent).not.toHaveBeenCalled();
		});
	});
});
