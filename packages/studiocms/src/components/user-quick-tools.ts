interface UserData {
	id: string;
	name: string;
	email: string | null;
	avatar: string | null;
	username: string;
}

interface Routes {
	logout: string;
	userProfile: string;
	contentManagement: string;
	dashboardIndex: string;
}

type PermissionLevel = 'editor' | 'visitor' | 'admin' | 'owner' | 'unknown';

interface MenuItem {
	name: string;
	svg: string;
	href: string;
	permission: PermissionLevel;
	cssClass: string;
}

interface GetSessionResponse {
	isLoggedIn: boolean;
	user: UserData;
	permissionLevel: PermissionLevel;
	routes: Routes;
}

// Optimized permission checking with Set for O(1) lookup
const PERMISSION_HIERARCHY: Record<PermissionLevel, Set<PermissionLevel>> = {
	owner: new Set(['owner']),
	admin: new Set(['owner', 'admin']),
	editor: new Set(['owner', 'admin', 'editor']),
	visitor: new Set(['owner', 'admin', 'editor', 'visitor']),
	unknown: new Set(['owner', 'admin', 'editor', 'visitor', 'unknown']),
};

const KNOWN_API_ROUTES = ['/studiocms_api/', '/_studiocms-devapps/', '/_web-vitals'];
const DEFAULT_AVATAR = 'https://seccdn.libravatar.org/static/img/mm/80.png';

// CSS moved to a template literal for better minification and caching
const COMPONENT_STYLES = `
:host {
    --border: 240 5% 17%;
    --background-base: 0 0% 6%;
    --background-step-1: 0 0% 8%;
    --background-step-2: 0 0% 10%;
    --background-step-3: 0 0% 14%;
    --primary-base: 259 83% 73%;
    --success-base: 142 71% 46%;
    --warning-base: 48 96% 53%;
    --danger-base: 339 97% 31%;
    --info-base: 217 92% 52%;
    --light: 70;
    --threshold: 50;
}

[data-theme="light"] {
    --border: 263 5% 68%;
    --background-base: 0 0% 97%;
    --background-step-1: 0 0% 90%;
    --background-step-2: 0 0% 85%;
    --background-step-3: 0 0% 80%;
    --primary-base: 259 85% 61%;
    --success-base: 142 59% 47%;
    --warning-base: 48 92% 46%;
    --danger-base: 339 97% 31%;
    --info-base: 217 92% 52%;
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
    background: hsl(var(--background-step-1));
    box-shadow: 0 3px 7px rgba(0,0,0,0.3);
    border-radius: 50%;
    border: 1px solid hsl(var(--border));
    z-index: 600;
    cursor: pointer;
}

.avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    z-index: 700;
}

.menu {
    --switch: calc((var(--light) - var(--threshold)) * -100%);
    position: absolute;
    width: 32px;
    height: 32px;
    background: hsl(var(--background-step-2));
    box-shadow: 0 3px 7px rgba(0,0,0,0.1);
    border-radius: 50%;
    border: 1px solid hsl(var(--border));
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
    pointer-events: all;
    cursor: pointer;
    transition: transform 0.3s ease, opacity 0.3s ease, background-color 0.15s ease;
}

.cornerMenu.menuOpened .menu:hover {
    background: hsl(var(--background-step-3));
}

.cornerMenu.menuOpened .menu:nth-child(1) { transform: translate(-105px, 20px); transition-delay: 0s; }
.cornerMenu.menuOpened .menu:nth-child(2) { transform: translate(-78px, -33px); transition-delay: 0.05s; }
.cornerMenu.menuOpened .menu:nth-child(3) { transform: translate(-38px, -76px); transition-delay: 0.1s; }
.cornerMenu.menuOpened .menu:nth-child(4) { transform: translate(18px, -99px); transition-delay: 0.15s; }

.menu.logout { color: hsl(var(--danger-base)); }
.menu.profile { color: hsl(var(--primary-base)); }
.menu.dashboard { color: hsl(var(--success-base)); }
.menu.edit { color: hsl(var(--warning-base)); }
`;

/**
 * Optimized permission verification with Set-based lookup
 */
function verifyUserPermissionLevel(
	userLevel: PermissionLevel,
	requiredLevel: PermissionLevel
): boolean {
	return PERMISSION_HIERARCHY[requiredLevel]?.has(userLevel) ?? false;
}

/**
 * Check if current path should skip rendering completely (no API calls)
 */
function shouldSkipRendering(pathname: string): boolean {
	return KNOWN_API_ROUTES.some((route) => pathname.includes(route));
}

/**
 * Check if current path is dashboard (skip after API call)
 */
function isDashboardRoute(pathname: string, dashboardRoute: string): boolean {
	return pathname.includes(dashboardRoute);
}

class UserQuickTools extends HTMLElement {
	private sessionData: GetSessionResponse | null = null;
	private isMenuOpen = false;
	private themeObserver: MutationObserver | null = null;
	private cornerMenu: HTMLElement | null = null;
	private menuOverlay: HTMLElement | null = null;

	// Static menu items configuration
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

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		// Use requestIdleCallback for non-blocking initialization
		this.scheduleInitialization();
	}

	private scheduleInitialization() {
		const initializeComponent = () => {
			const pathname = window.location.pathname;

			// First check: Skip entirely if on API routes (no API call needed)
			if (shouldSkipRendering(pathname)) {
				return;
			}

			// Start async initialization without blocking
			this.initializeAsync(pathname).catch((error) => {
				console.error('UserQuickTools initialization failed:', error);
			});
		};

		// Use requestIdleCallback if available, otherwise setTimeout
		if ('requestIdleCallback' in window) {
			requestIdleCallback(initializeComponent, { timeout: 1000 });
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
	}

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
	}

	private render(): void {
		if (!this.shadowRoot || !this.sessionData) return;

		// Create overlay
		this.menuOverlay = document.createElement('div');
		this.menuOverlay.className = 'menu_overlay';

		// Create main menu container
		this.cornerMenu = document.createElement('div');
		this.cornerMenu.className = 'cornerMenu';
		this.cornerMenu.dataset.theme = document.documentElement.dataset.theme ?? 'dark';

		// Add menu items
		this.addMenuItems();
		this.addUserAvatar();

		// Append elements
		this.shadowRoot.append(document.createElement('style'), this.menuOverlay, this.cornerMenu);

		// Add styles
		// biome-ignore lint/style/noNonNullAssertion: we know style element exists here
		this.shadowRoot.querySelector('style')!.textContent = COMPONENT_STYLES;
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

		UserQuickTools.MENU_ITEMS.forEach((item) => {
			if (verifyUserPermissionLevel(permissionLevel, item.permission)) {
				const menuElement = this.createMenuElement({
					...item,
					href: routeMap[item.name],
				});
				// biome-ignore lint/style/noNonNullAssertion: we know cornerMenu exists here
				this.cornerMenu!.appendChild(menuElement);
			}
		});
	}

	private createMenuElement(item: MenuItem): HTMLAnchorElement {
		const element = document.createElement('a');
		element.className = `menu ${item.cssClass}`;
		element.title = item.name;
		element.innerHTML = item.svg;
		element.href = item.href;
		return element;
	}

	private addUserAvatar(): void {
		if (!this.cornerMenu || !this.sessionData) return;

		const { user, permissionLevel } = this.sessionData;
		const avatar = document.createElement('img');
		const displayName = `${user.name} - ${this.capitalizeFirst(permissionLevel)}`;

		Object.assign(avatar, {
			src: user.avatar || DEFAULT_AVATAR,
			alt: displayName,
			title: displayName,
			width: '32',
			height: '32',
			className: 'avatar',
		});

		avatar.setAttribute('aria-hidden', 'true');
		this.cornerMenu.appendChild(avatar);
	}

	private setupEventListeners(): void {
		if (!this.cornerMenu || !this.menuOverlay) return;

		// Menu toggle
		this.cornerMenu.addEventListener('click', this.handleMenuToggle.bind(this));

		// Overlay click to close
		this.menuOverlay.addEventListener('click', this.handleOverlayClick.bind(this));
	}

	private handleMenuToggle(): void {
		this.isMenuOpen = !this.isMenuOpen;
		this.updateMenuState();
	}

	private handleOverlayClick(): void {
		if (this.isMenuOpen) {
			this.isMenuOpen = false;
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
			// biome-ignore lint/style/noNonNullAssertion: we know cornerMenu exists here
			this.cornerMenu!.dataset.theme = theme === 'light' ? 'light' : 'dark';
		};

		this.themeObserver = new MutationObserver(updateTheme);
		this.themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme'],
		});
	}

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

			clearTimeout(timeoutId);
			return response.ok ? await response.json() : null;
		} catch (error) {
			// Network errors should not block page rendering
			if (error instanceof Error && error.name === 'AbortError') {
				console.warn('Session verification timed out');
			} else {
				console.warn('Session verification failed:', error);
			}
			return null;
		}
	}

	private capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	private cleanup(): void {
		this.themeObserver?.disconnect();
		this.themeObserver = null;
		this.cornerMenu = null;
		this.menuOverlay = null;
		this.sessionData = null;
	}
}

// Use more efficient registration check and avoid potential race conditions
if ('customElements' in window && !customElements.get('user-quick-tools')) {
	customElements.define('user-quick-tools', UserQuickTools);
}

// Improved DOM ready detection with non-blocking approach
function initializeWhenReady() {
	const createElement = () => {
		if (!document.querySelector('user-quick-tools')) {
			const element = document.createElement('user-quick-tools');
			document.body.appendChild(element);
		}
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			// Use setTimeout to avoid blocking DOMContentLoaded handlers
			setTimeout(createElement, 0);
		});
	} else {
		// DOM is already ready - schedule for next tick
		setTimeout(createElement, 0);
	}
}

// Initialize when script loads
initializeWhenReady();
