// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
	ConfigurableUserQuickTools,
	initializeWhenReady,
	isDashboardRoute,
	KNOWN_API_ROUTES,
	shouldSkipRendering,
	type UserQuickTools,
	verifyUserPermissionLevel,
} from '../../../src/virtuals/scripts/user-quick-tools';

describe('Permission logic', () => {
	it('verifyUserPermissionLevel returns correct values', () => {
		expect(verifyUserPermissionLevel('owner', 'owner')).toBe(true);
		expect(verifyUserPermissionLevel('admin', 'owner')).toBe(false);
		expect(verifyUserPermissionLevel('admin', 'admin')).toBe(true);
		expect(verifyUserPermissionLevel('editor', 'admin')).toBe(false);
		expect(verifyUserPermissionLevel('editor', 'editor')).toBe(true);
		expect(verifyUserPermissionLevel('visitor', 'editor')).toBe(false);
		expect(verifyUserPermissionLevel('visitor', 'visitor')).toBe(true);
		expect(verifyUserPermissionLevel('unknown', 'visitor')).toBe(false);
	});
});

describe('Route logic', () => {
	it('shouldSkipRendering returns true for known API routes', () => {
		for (const route of KNOWN_API_ROUTES) {
			expect(shouldSkipRendering(route)).toBe(true);
			expect(shouldSkipRendering(route + 'something')).toBe(true);
		}
		expect(shouldSkipRendering('/dashboard')).toBe(false);
	});

	it('isDashboardRoute returns correct values', () => {
		expect(isDashboardRoute('/dashboard', '/dashboard')).toBe(true);
		expect(isDashboardRoute('/dashboard/settings', '/dashboard')).toBe(true);
		expect(isDashboardRoute('/profile', '/dashboard')).toBe(false);
	});
});

describe('UserQuickTools custom element', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		if (!customElements.get('user-quick-tools')) {
			customElements.define('user-quick-tools', ConfigurableUserQuickTools);
		}
	});

	it('registers the custom element', () => {
		expect(customElements.get('user-quick-tools')).toBeDefined();
	});

	it('appends the element to the DOM on initializeWhenReady', async () => {
		document.body.innerHTML = '';
		initializeWhenReady();
		await new Promise((r) => setTimeout(r, 20));
		expect(document.querySelector('user-quick-tools')).toBeTruthy();
	});

	it('does not render menu if shouldSkipRendering returns true', async () => {
		Object.defineProperty(window, 'location', {
			value: { pathname: KNOWN_API_ROUTES[0] },
			writable: true,
		});
		const el = document.createElement('user-quick-tools') as UserQuickTools;
		document.body.appendChild(el);
		el.connectedCallback();
		expect(el.shadowRoot?.querySelector('.cornerMenu')).toBeNull();
	});

	it('toggles menu open/close on click', async () => {
		const el = document.createElement('user-quick-tools') as UserQuickTools;
		document.body.appendChild(el);
		el.scheduleInitialization();
		await new Promise((r) => setTimeout(r, 50));
		const menu = el.shadowRoot?.querySelector('.cornerMenu');
		if (menu) {
			menu.dispatchEvent(new MouseEvent('click'));
			expect(menu.classList.contains('menuOpened')).toBe(true);
			menu.dispatchEvent(new MouseEvent('click'));
			expect(menu.classList.contains('menuOpened')).toBe(false);
		}
	});
});
