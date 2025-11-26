export interface UserData {
	id: string;
	name: string;
	email: string | null;
	avatar: string | null;
	username: string;
}

export interface Routes {
	logout: string;
	userProfile: string;
	contentManagement: string;
	dashboardIndex: string;
}

export type PermissionLevel = 'editor' | 'visitor' | 'admin' | 'owner' | 'unknown';

export interface MenuItem {
	name: string;
	svg: string;
	href: string;
	permission: PermissionLevel;
	cssClass: string;
}

export interface GetSessionResponse {
	isLoggedIn: boolean;
	user: UserData;
	permissionLevel: PermissionLevel;
	routes: Routes;
}

// Optimized permission checking with Set for O(1) lookup
export const PERMISSION_HIERARCHY: Record<PermissionLevel, Set<PermissionLevel>> = {
	owner: new Set(['owner']),
	admin: new Set(['owner', 'admin']),
	editor: new Set(['owner', 'admin', 'editor']),
	visitor: new Set(['owner', 'admin', 'editor', 'visitor']),
	unknown: new Set(['owner', 'admin', 'editor', 'visitor', 'unknown']),
};

export const KNOWN_API_ROUTES = ['/studiocms_api/', '/_studiocms-devapps/', '/_web-vitals'];
export const DEFAULT_AVATAR =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADSklEQVR4AdSWS2xMYRTHjQXRRupRKVWrJhrxSCRigTQpYUHq0VYsarwi8RgJ0rCwFJEQEQ1psZFQXWgGRZB6NdFalkSFFRutV1UJNhLj9+dcOubeud8dC2lzfvd/7vedc77TO999DB/2n/+GZgOpVCoOSegx5K/N5WJGugIsNhHusNBZqIJiQ/455tqgiDFni9QAVZthIVyBBTAWJsBKeAOL4Tw4m3MD/GebqVoBV2Ox2ArohAHog1bGZ0MfLCJ2A+pkzg1QrRpkB3X4G5p4xdhOkOknkYYSpYE5Vu2pqZ/ctUFdDXOzS5QGvlkplxyXmJ/lnAOJfgSyMh0C0AbVVJcOLkRp4JQV3GeaJmy8SQzUg6xRBxecG2CTaaffpGgli12DeVAAhaDb8CFzhXCZ2Ouokzk3YNU2ordhGXTCALyDS6AH0C10CzhbpAb4z16DHjZxVtCivWgPJCHO3BJ4i+9skRrwqrJIE1TBZCiBGmjy5qNoTg1EWSAsNlIDbLZi2AEt0A2fDPkX8BOguyFs3d/zTg1QNB+OkPUcjkMNTIfRhvzV+CfgBbGHYBR+qIU2QCG97dqpVAcjoRuOgpqYggr5GnvCuWL2ou3kjkOzWtYGKFBAdgfoPfAR1S02iw1XB0l4achXgzOJ2QaKnYt2WA1cfwtsgETNtZA2FXR/l7LYaUhx7muag5NMloI+XKahzdSKob6mRXwnGEyA7nm949dQ+D3nTmax2hN6SC0lSVcOyTTfBuhYl36/hddS8IP5zmI56y3hADW1Ye30j/g2wLQ21Ri0i0JtaE5G7g0SH8N40PsCSbegBiot7J7pv4hXw6uZViuogRkWpdvP3JzFq6E7JKNIUAP63FbwJn67KsjTSRSUA/o2XGd5Xk07/SVBDei7/zshq0Bvun6KtcIeqIUKKAM9IfNQ+RrTnGL07dBvufrtVesM5xnm2wCbZyuRer9vR+/DCFgOh0FvPX18PsP/DF9AvsY0pxjFKke5up2LqLmLuAzzbUBRJOh7vxEt57wEVKABvQgPQO+Fr6iQrzHNKWY343pNl5PfAHqWMJRpgQ0MDqVAL9RDAqphPujJmI8K+RrTnGKOMa6PlcFlfH2nBnwzHQfDwn4AAAD//6qWhy8AAAAGSURBVAMAJXQ0UKI3Vu0AAAAASUVORK5CYII=';

// Enhanced CSS with click protection and visual feedback
export const COMPONENT_STYLES = `
:host {
    --border: hsl(240 5% 17%);
    --background-base: hsl(0 0% 6%);
    --background-step-1: hsl(0 0% 8%);
    --background-step-2: hsl(0 0% 10%);
    --background-step-3: hsl(0 0% 14%);
    --primary-base: hsl(259 83% 73%);
    --success-base: hsl(142 71% 46%);
    --warning-base: hsl(48 96% 53%);
    --danger-base: hsl(339 97% 31%);
    --info-base: hsl(217 92% 52%);
    --light: 70;
    --threshold: 50;
}

[data-theme="light"] {
    --border: hsl(263 5% 68%);
    --background-base: hsl(0 0% 97%);
    --background-step-1: hsl(0 0% 90%);
    --background-step-2: hsl(0 0% 85%);
    --background-step-3: hsl(0 0% 80%);
    --primary-base: hsl(259 85% 61%);
    --success-base: hsl(142 59% 47%);
    --warning-base: hsl(48 92% 46%);
    --danger-base: hsl(339 97% 31%);
    --info-base: hsl(217 92% 52%);
}

.menu_overlay {
    position: fixed;
    background: rgba(0,0,0,0.4);
    inset: 0;
    z-index: 500;
    display: none;
}

.menu_overlay.menuOpened {
    display: block;
}

.cornerMenu {
    position: fixed;
    right: 25px;
    bottom: 25px;
    width: 50px;
    height: 50px;
    background: var(--background-step-1);
    box-shadow: 0 3px 7px rgba(0,0,0,0.3);
    border-radius: 50%;
    z-index: 600;
    cursor: pointer;
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-container {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--background-step-1);
    border: 1px solid var(--border);
    object-fit: cover;
    z-index: 700;
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar {
    width: 100%;
    height: 100%;
    background: var(--background-step-1);
    border: 1px solid var(--border);
    border-radius: 50%;
    object-fit: cover;
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-error {
    width: 100%;
	height: auto;
	margin: 2.5rem;
	border: none;
}

.cornerMenu.menuOpened .avatar-container {
    transform: scale(1.5);
    border: 1px solid var(--border);
}

.menu {
    --switch: calc((var(--light) - var(--threshold)) * -100%);
    position: absolute;
    width: 32px;
    height: 32px;
    background: var(--background-step-2);
    box-shadow: 0 3px 7px rgba(0,0,0,0.1);
    border-radius: 50%;
    border: 1px solid var(--border);
    color: hsl(0, 0%, var(--switch));
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    top: -5px;
    left: -5px;
    opacity: 0;
    z-index: 550;
    pointer-events: none;
    user-select: none;
    transition: all 0.4s ease-in-out;
    text-decoration: none;
}

.menu svg {
    width: 24px;
    height: 24px;
}

.cornerMenu.menuOpened .menu {
    opacity: 1;
    cursor: pointer;
    transition: transform 0.3s ease, opacity 0.3s ease, background-color 0.15s ease;
}

.cornerMenu.menuOpened .menu:hover {
    background: var(--background-step-3);
}

/* Click protection: Only enable pointer events when menu is ready */
.cornerMenu.menu-ready .menu {
    pointer-events: all;
    box-shadow: 0 3px 7px rgba(0,0,0,0.1),
                0 0 0 1px color-mix(in hsl, var(--primary-base) 20%, transparent);
}

.cornerMenu.menu-ready .menu:hover {
    box-shadow: 0 3px 7px rgba(0,0,0,0.2),
                0 0 0 2px color-mix(in hsl, var(--primary-base) 40%, transparent);
}

/* Visual feedback for ignored clicks */
.menu.click-ignored {
    animation: shake 0.3s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0) translateY(0); }
    25% { transform: translateX(-2px) translateY(-1px); }
    50% { transform: translateX(2px) translateY(1px); }
    75% { transform: translateX(-1px) translateY(-2px); }
}

.cornerMenu.menuOpened .menu:nth-child(1) { transform: translate(-105px, 20px); transition-delay: 0s; }
.cornerMenu.menuOpened .menu:nth-child(2) { transform: translate(-78px, -33px); transition-delay: 0.05s; }
.cornerMenu.menuOpened .menu:nth-child(3) { transform: translate(-38px, -76px); transition-delay: 0.1s; }
.cornerMenu.menuOpened .menu:nth-child(4) { transform: translate(18px, -99px); transition-delay: 0.15s; }

.menu.logout { color: var(--danger-base); }
.menu.profile { color: var(--primary-base); }
.menu.dashboard { color: var(--success-base); }
.menu.edit { color: var(--warning-base); }
`;

/**
 * Optimized permission verification with Set-based lookup
 */
export function verifyUserPermissionLevel(
	userLevel: PermissionLevel,
	requiredLevel: PermissionLevel
): boolean {
	return PERMISSION_HIERARCHY[requiredLevel]?.has(userLevel) ?? false;
}

/**
 * Check if current path should skip rendering completely (no API calls)
 */
export function shouldSkipRendering(pathname: string): boolean {
	return KNOWN_API_ROUTES.some((route) => pathname.includes(route));
}

/**
 * Check if current path is dashboard (skip after API call)
 */
export function isDashboardRoute(pathname: string, dashboardRoute: string): boolean {
	return pathname.includes(dashboardRoute);
}

export class UserQuickTools extends HTMLElement {
	private sessionData: GetSessionResponse | null = null;
	private isMenuOpen = false;
	private menuItemsReady = false;
	private lastMenuToggleTime = 0;
	private readyTimeout: number | null = null;
	private themeObserver: MutationObserver | null = null;
	private cornerMenu: HTMLElement | null = null;
	private menuOverlay: HTMLElement | null = null;
	private isInitialized = false;
	private userInteractionListeners: Array<{ event: string; handler: EventListener }> = [];

	// Click protection settings
	protected CLICK_PROTECTION_DURATION = 400; // milliseconds
	protected MENU_READY_DELAY = 350; // milliseconds (after animation completes)

	// Static menu items configuration
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Used in methods
	private static readonly MENU_ITEMS: Omit<MenuItem, 'href'>[] = [
		{
			name: 'Logout',
			svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" /></svg>',
			permission: 'visitor',
			cssClass: 'logout',
		},
		{
			name: 'Profile',
			svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>',
			permission: 'visitor',
			cssClass: 'profile',
		},
		{
			name: 'Dashboard',
			svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" /></svg>',
			permission: 'editor',
			cssClass: 'dashboard',
		},
		{
			name: 'Edit',
			svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>',
			permission: 'editor',
			cssClass: 'edit',
		},
	];

	private get menuItems() {
		return UserQuickTools.MENU_ITEMS;
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		/* v8 ignore start */
		// Check if we should skip entirely
		const pathname = window.location.pathname;
		if (shouldSkipRendering(pathname)) {
			return;
		}

		// Initialize on user interaction for maximum Lighthouse score
		this.initOnUserInteraction();
	}
	/* v8 ignore stop */

	public initOnUserInteraction() {
		// Events that indicate user engagement
		const interactionEvents = [
			'mouseenter',
			'mousemove',
			'touchstart',
			'scroll',
			'keydown',
			'click',
		];

		/* v8 ignore start */
		const handleUserInteraction = () => {
			if (this.isInitialized) return;

			// Remove all interaction listeners
			this.removeInteractionListeners();

			// Start initialization
			this.scheduleInitialization();
		};
		/* v8 ignore stop */

		// Add passive listeners for performance
		interactionEvents.forEach((eventType) => {
			const listener = handleUserInteraction;
			document.addEventListener(eventType, listener, {
				passive: true,
				once: true, // Automatically removes after first trigger
			});

			// Store reference for manual cleanup if needed
			this.userInteractionListeners.push({ event: eventType, handler: listener });
		});
	}

	private removeInteractionListeners() {
		this.userInteractionListeners.forEach(({ event, handler }) => {
			document.removeEventListener(event, handler);
		});
		this.userInteractionListeners = [];
	}

	public scheduleInitialization() {
		if (this.isInitialized) return;
		this.isInitialized = true;

		const initializeComponent = () => {
			const pathname = window.location.pathname;

			// Start async initialization without blocking
			this.initializeAsync(pathname).catch((error) => {
				/* v8 ignore start */
				console.error('UserQuickTools initialization failed:', error);
				/* v8 ignore stop */
			});
		};

		// Use requestIdleCallback if available, otherwise setTimeout
		if ('requestIdleCallback' in window) {
			/* v8 ignore start */
			requestIdleCallback(initializeComponent, { timeout: 1000 });
			/* v8 ignore stop */
		} else {
			setTimeout(initializeComponent, 0);
		}
	}

	private async initializeAsync(pathname: string) {
		try {
			// Second check: Get session data (non-blocking)
			const sessionData = await this.getSession();

			// Third check: Skip if not logged in
			if (!sessionData?.isLoggedIn) {
				return;
			}
			/* v8 ignore start */
			// Fourth check: Skip if on dashboard (after API call to verify session)
			if (isDashboardRoute(pathname, sessionData.routes.dashboardIndex)) {
				return;
			}

			// All checks passed - render the component
			this.sessionData = sessionData;

			// Schedule rendering during idle time to avoid blocking
			this.scheduleRender();
		} catch (error) {
			// Fail silently for better UX - component just won't appear
			console.warn('UserQuickTools failed to initialize:', error);
		}
		/* v8 ignore stop */
	}
	/* v8 ignore start */
	private scheduleRender() {
		const renderComponent = () => {
			this.render();
			this.setupEventListeners();
			this.setupThemeObserver();
		};

		// Use requestAnimationFrame for smooth rendering
		requestAnimationFrame(() => {
			if ('requestIdleCallback' in window) {
				requestIdleCallback(renderComponent, { timeout: 500 });
			} else {
				setTimeout(renderComponent, 0);
			}
		});
	}

	disconnectedCallback() {
		this.cleanup();
		this.removeInteractionListeners();
	}

	private async render(): Promise<void> {
		if (!this.shadowRoot || !this.sessionData) return;

		// Create overlay
		this.menuOverlay = document.createElement('div');
		this.menuOverlay.className = 'menu_overlay';

		// Create main menu container
		this.cornerMenu = document.createElement('div');
		this.cornerMenu.className = 'cornerMenu';
		this.cornerMenu.dataset.theme = document.documentElement.dataset.theme ?? 'dark';

		const styleElm = document.createElement('style');
		styleElm.textContent = COMPONENT_STYLES;

		// Add menu items
		this.addMenuItems();
		// Append elements early for faster paint
		this.shadowRoot.append(styleElm, this.menuOverlay, this.cornerMenu);
		// Load avatar asynchronously; avoid unhandled rejections
		void this.addUserAvatar().catch((e) => console.warn('Avatar load failed:', e));
	}

	private addMenuItems(): void {
		if (!this.cornerMenu || !this.sessionData) return;

		const { routes, permissionLevel } = this.sessionData;
		const routeMap: Record<string, string> = {
			Logout: routes.logout,
			Profile: routes.userProfile,
			Dashboard: routes.dashboardIndex,
			Edit: routes.contentManagement,
		};

		this.menuItems.forEach((item) => {
			if (verifyUserPermissionLevel(permissionLevel, item.permission)) {
				const menuElement = this.createMenuElement({
					...item,
					href: routeMap[item.name],
				});
				// biome-ignore lint/style/noNonNullAssertion: this is safe as we check for element existence
				this.cornerMenu!.appendChild(menuElement);
			}
		});
	}

	private createMenuElement(item: MenuItem): HTMLAnchorElement {
		// For logout, create a custom element to handle POST submission
		if (item.name === 'Logout') {
			return this.createLogoutElement(item);
		}
		const element = document.createElement('a');
		element.className = `menu ${item.cssClass}`;
		element.title = item.name;
		// Create SVG element safely
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(item.svg, 'image/svg+xml');
		const svgElement = svgDoc.documentElement;
		if (svgElement && svgElement.nodeName === 'svg') {
			element.appendChild(svgElement.cloneNode(true));
		} else {
			console.warn('Invalid SVG content for menu item:', item.name);
		}
		element.href = item.href;

		// Add click protection
		element.addEventListener('click', (e) => {
			const timeSinceToggle = Date.now() - this.lastMenuToggleTime;

			// Prevent clicks if menu items aren't ready OR if clicked too soon after toggle
			if (!this.menuItemsReady || timeSinceToggle < this.CLICK_PROTECTION_DURATION) {
				e.preventDefault();
				e.stopPropagation();

				// Visual feedback for ignored clicks
				element.classList.add('click-ignored');
				setTimeout(() => element.classList.remove('click-ignored'), 300);

				return false;
			}
		});

		return element;
	}

	private createLogoutElement(item: MenuItem): HTMLAnchorElement {
		const element = document.createElement('a');
		element.className = `menu ${item.cssClass}`;
		element.title = item.name;
		element.href = '#'; // Prevent default navigation

		// Create SVG element safely
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(item.svg, 'image/svg+xml');
		const svgElement = svgDoc.documentElement;
		if (svgElement && svgElement.nodeName === 'svg') {
			element.appendChild(svgElement.cloneNode(true));
		}

		// Handle logout with form submission
		element.addEventListener('click', (e) => {
			e.preventDefault();

			const timeSinceToggle = Date.now() - this.lastMenuToggleTime;
			if (!this.menuItemsReady || timeSinceToggle < this.CLICK_PROTECTION_DURATION) {
				element.classList.add('click-ignored');
				setTimeout(() => element.classList.remove('click-ignored'), 300);
				return;
			}

			this.submitLogoutForm(item.href);
		});

		return element;
	}

	private submitLogoutForm(logoutUrl: string): void {
		// Create a hidden form for POST submission
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = logoutUrl;
		form.style.display = 'none';

		document.body.appendChild(form);
		form.submit();
	}

	private async testAvatarURL(url: string) {
		let urlObj: URL;
		try {
			urlObj = new URL(url);
		} catch {
			console.warn('Invalid avatar URL:', url);
			return undefined;
		}
		// Only allow HTTPS (avoid mixed content + downgrade attacks)
		if (urlObj.protocol !== 'https:') {
			console.error(`Insecure avatar URL protocol: ${urlObj.protocol}`);
			return undefined;
		}
		const controller = new AbortController();
		const timeoutId = window.setTimeout(() => controller.abort(), 4000);
		try {
			const response = await fetch(url, {
				method: 'HEAD',
				signal: controller.signal,
				cache: 'no-cache',
			});
			if (!response.ok) return undefined;
			const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
			if (!contentType.startsWith('image/')) return undefined;
			if (contentType === 'image/svg+xml') {
				console.error('Remote SVG avatars are disallowed for security.');
				return undefined;
			}
			return { type: contentType };
		} catch (err) {
			console.warn('Avatar HEAD check failed:', err);
			return undefined;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	private async addUserAvatar(): Promise<void> {
		if (!this.cornerMenu || !this.sessionData) return;

		const { user, permissionLevel } = this.sessionData;

		const avatarContainer = document.createElement('div');
		avatarContainer.className = 'avatar-container';

		const newAvatar = document.createElement('img');

		const avatar = await (async () => {
			let avatar = DEFAULT_AVATAR;

			if (user.avatar) {
				const result = await this.testAvatarURL(user.avatar);
				if (result) {
					avatar = user.avatar;
				}
			}

			return avatar;
		})();

		newAvatar.src = avatar;
		newAvatar.width = 64;
		newAvatar.height = 64;
		newAvatar.className = 'avatar';
		newAvatar.alt = `${user.name} - ${this.capitalizeFirst(permissionLevel)}`;
		newAvatar.loading = 'lazy';
		newAvatar.decoding = 'async';
		newAvatar.referrerPolicy = 'no-referrer';

		if (avatar === DEFAULT_AVATAR) {
			newAvatar.classList.add('avatar-error');
		}

		newAvatar.onerror = function () {
			this.src = DEFAULT_AVATAR;
		};
		newAvatar.setAttribute('aria-hidden', 'true');

		avatarContainer.appendChild(newAvatar);

		// Append the avatar to the corner menu
		this.cornerMenu.appendChild(avatarContainer);
	}

	private setupEventListeners(): void {
		if (!this.cornerMenu || !this.menuOverlay) return;

		// Menu toggle
		this.cornerMenu.addEventListener('click', this.handleMenuToggle.bind(this));

		// Overlay click to close
		this.menuOverlay.addEventListener('click', this.handleOverlayClick.bind(this));
	}

	private handleMenuToggle(): void {
		this.lastMenuToggleTime = Date.now();
		this.isMenuOpen = !this.isMenuOpen;

		if (this.isMenuOpen) {
			// Menu is opening - delay clickable state
			this.menuItemsReady = false;
			this.cornerMenu?.classList.remove('menu-ready');

			this.readyTimeout = window.setTimeout(() => {
				this.menuItemsReady = true;
				this.cornerMenu?.classList.add('menu-ready');
			}, this.MENU_READY_DELAY);
		} else {
			// Menu is closing - immediately disable clicks
			this.menuItemsReady = false;
			this.cornerMenu?.classList.remove('menu-ready');
			if (this.readyTimeout) {
				clearTimeout(this.readyTimeout);
				this.readyTimeout = null;
			}
		}

		this.updateMenuState();
	}

	private handleOverlayClick(): void {
		if (this.isMenuOpen) {
			this.isMenuOpen = false;
			this.menuItemsReady = false;
			this.cornerMenu?.classList.remove('menu-ready');
			if (this.readyTimeout) {
				clearTimeout(this.readyTimeout);
				this.readyTimeout = null;
			}
			this.updateMenuState();
		}
	}

	private updateMenuState(): void {
		if (!this.cornerMenu || !this.menuOverlay) return;

		const method = this.isMenuOpen ? 'add' : 'remove';
		this.cornerMenu.classList[method]('menuOpened');
		this.menuOverlay.classList[method]('menuOpened');
	}

	private setupThemeObserver(): void {
		if (!this.cornerMenu) return;

		const updateTheme = () => {
			const theme = document.documentElement.getAttribute('data-theme');
			// biome-ignore lint/style/noNonNullAssertion: this is safe as we check for element existence
			this.cornerMenu!.dataset.theme = theme === 'light' ? 'light' : 'dark';
		};

		this.themeObserver = new MutationObserver(updateTheme);
		this.themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme'],
		});
	}
	/* v8 ignore stop */

	private async getSession(): Promise<GetSessionResponse | null> {
		try {
			// Add timeout to prevent hanging requests
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

			const response = await fetch('/studiocms_api/dashboard/verify-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ originPathname: window.location.toString() }),
				signal: controller.signal,
			});

			/* v8 ignore start */
			clearTimeout(timeoutId);
			return response.ok ? await response.json() : null;
			/* v8 ignore stop */
		} catch (error) {
			// Network errors should not block page rendering
			if (error instanceof Error && error.name === 'AbortError') {
				/* v8 ignore start */
				console.warn('Session verification timed out');
				/* v8 ignore stop */
			} else {
				console.warn('Session verification failed:', error);
			}
			return null;
		}
	}

	/* v8 ignore start */
	private capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	private cleanup(): void {
		this.themeObserver?.disconnect();
		this.themeObserver = null;

		// Clean up click protection timeout
		if (this.readyTimeout) {
			clearTimeout(this.readyTimeout);
			this.readyTimeout = null;
		}

		this.cornerMenu = null;
		this.menuOverlay = null;
		this.sessionData = null;
		this.isInitialized = false;
		this.menuItemsReady = false;
		this.lastMenuToggleTime = 0;
	}
	/* v8 ignore stop */
}

// Optional: Add configuration for different initialization strategies
export interface UserQuickToolsConfig {
	strategy: 'immediate' | 'idle' | 'interaction';
	timeout?: number;
	clickProtectionDuration?: number;
	menuReadyDelay?: number;
}

// Enhanced custom element with configuration support
export class ConfigurableUserQuickTools extends UserQuickTools {
	private config: UserQuickToolsConfig;

	constructor() {
		super();
		// Read config from data attributes or default to interaction mode
		this.config = {
			strategy:
				(this.getAttribute('data-init-strategy') as UserQuickToolsConfig['strategy']) ||
				'interaction',
			timeout: Number.parseInt(this.getAttribute('data-timeout') || '1000', 10),
			clickProtectionDuration: Number.parseInt(
				this.getAttribute('data-click-protection') || '400',
				10
			),
			menuReadyDelay: Number.parseInt(this.getAttribute('data-menu-delay') || '350', 10),
		};

		// Override defaults with config values
		if (this.config.clickProtectionDuration) {
			this.CLICK_PROTECTION_DURATION = this.config.clickProtectionDuration;
		}
		if (this.config.menuReadyDelay) {
			this.MENU_READY_DELAY = this.config.menuReadyDelay;
		}
	}

	connectedCallback() {
		const pathname = window.location.pathname;
		if (shouldSkipRendering(pathname)) {
			return;
		}

		switch (this.config.strategy) {
			case 'immediate':
				/* v8 ignore start */
				this.scheduleInitialization();
				break;
			/* v8 ignore stop */
			case 'idle':
				/* v8 ignore start */
				if ('requestIdleCallback' in window) {
					requestIdleCallback(() => this.scheduleInitialization(), {
						timeout: this.config.timeout,
					});
				} else {
					setTimeout(() => this.scheduleInitialization(), 0);
				}
				break;
			/* v8 ignore stop */
			case 'interaction':
				this.initOnUserInteraction();
				break;
			default:
				/* v8 ignore start */
				console.warn(`Unknown initialization strategy: ${this.config.strategy}`);
				this.initOnUserInteraction();
				break;
			/* v8 ignore stop */
		}
	}
}

// Also register the configurable version
if ('customElements' in window && !customElements.get('user-quick-tools')) {
	customElements.define('user-quick-tools', ConfigurableUserQuickTools);
}

// Improved DOM ready detection with non-blocking approach
export function initializeWhenReady() {
	const createElement = () => {
		if (!document.querySelector('user-quick-tools')) {
			// Development version: Use the basic user quick tools component
			// const element = document.createElement('user-quick-tools');
			// element.setAttribute('data-init-strategy', 'immediate');

			// Production version: Use configurable version with data attributes
			const element = document.createElement('user-quick-tools');
			element.setAttribute('data-init-strategy', 'idle');
			element.setAttribute('data-timeout', '1000');

			// Click protection and menu ready delay
			element.setAttribute('data-click-protection', '400'); // 400ms click protection
			element.setAttribute('data-menu-delay', '350'); // 350ms menu ready delay

			// Append to body
			document.body.appendChild(element);
		}
	};

	if (document.readyState === 'loading') {
		/* v8 ignore start */
		document.addEventListener('DOMContentLoaded', () => {
			// Use setTimeout to avoid blocking DOMContentLoaded handlers
			setTimeout(createElement, 0);
		});
		/* v8 ignore stop */
	} else {
		// DOM is already ready - schedule for next tick
		setTimeout(createElement, 0);
	}
}

// Initialize when script loads
initializeWhenReady();
