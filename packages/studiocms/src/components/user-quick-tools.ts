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
}

const permissionRanksMap: Record<PermissionLevel, string[]> = {
	owner: ['owner'],
	admin: ['owner', 'admin'],
	editor: ['owner', 'admin', 'editor'],
	visitor: ['owner', 'admin', 'editor', 'visitor'],
	unknown: ['owner', 'admin', 'editor', 'visitor', 'unknown'],
};

interface GetSessionResponse {
	isLoggedIn: boolean;
	user: UserData;
	permissionLevel: PermissionLevel;
	routes: Routes;
}

const knownAPIRoutes = ['/studiocms_api/', '/_studiocms-devapps/'];

/**
 * Verifies if the user's permission level meets the required permission rank.
 *
 * @param userData - The session data of the user, which includes their permission level.
 * @param requiredPermission - The required permission rank to be verified against the user's permission level.
 * @returns A promise that resolves to a boolean indicating whether the user's permission level meets the required rank.
 */
function verifyUserPermissionLevel(
	permissionLevel: PermissionLevel,
	requiredPermission: PermissionLevel
): boolean {
	return permissionRanksMap[requiredPermission].includes(permissionLevel);
}

class UserQuickTools extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	async connectedCallback() {
		const data = await this.getSession();

		if (!data || !data.isLoggedIn) {
			return;
		}

		// If the user is on the dashboard, don't render the quick tools
		if (window.location.pathname.includes(data.routes.dashboardIndex)) {
			return;
		}

		// If the user is on any of the known StudioCMS API routes, don't render the quick tools
		if (knownAPIRoutes.some((route) => window.location.pathname.includes(route))) {
			return;
		}

		this.render(data.user, data.permissionLevel, data.routes);

		const shadow = this.shadowRoot;

		if (!shadow) {
			return;
		}

		const cornerMenu = shadow.querySelector<HTMLElement>('.cornerMenu');
		const menu_overlay = shadow.querySelector<HTMLElement>('.menu_overlay');

		if (!cornerMenu || !menu_overlay) {
			return;
		}

		let menuOpened = false;

		cornerMenu.addEventListener('click', () => {
			if (menuOpened) {
				cornerMenu.classList.remove('menuOpened');
				menu_overlay.classList.remove('menuOpened');
				menuOpened = false;
				return;
			}

			cornerMenu.classList.add('menuOpened');
			menu_overlay.classList.add('menuOpened');
			menuOpened = true;

			menu_overlay.addEventListener('click', () => {
				if (!menuOpened) {
					return;
				}
				cornerMenu.classList.remove('menuOpened');
				menu_overlay.classList.remove('menuOpened');
				menuOpened = false;
			});
		});

		const targetNode = document.documentElement;

		const config = {
			attributes: true,
			attributeOldValue: true,
		};

		const mutationObserverCallback: MutationCallback = (mutationsList) => {
			for (const mutation of mutationsList) {
				if (mutation.type === 'attributes') {
					if (targetNode.getAttribute('data-theme') === 'light') {
						cornerMenu.dataset.theme = 'light';
					} else {
						cornerMenu.dataset.theme = 'dark';
					}
				}
			}
		};

		const observer = new MutationObserver(mutationObserverCallback);

		observer.observe(targetNode, config);
	}

	render(user: UserData, permissionLevel: PermissionLevel, routes: Routes) {
		const menuItems: MenuItem[] = [
			{
				name: 'Logout',
				svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" /></svg> ',
				href: routes.logout,
				permission: 'visitor',
			},
			{
				name: 'Profile',
				svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>',
				href: routes.userProfile,
				permission: 'visitor',
			},
			{
				name: 'Dashboard',
				svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" /></svg>',
				href: routes.dashboardIndex,
				permission: 'editor',
			},
			{
				name: 'Edit',
				svg: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>',
				href: routes.contentManagement,
				permission: 'editor',
			},
		];

		const shadowDOM = this.shadowRoot;

		if (!shadowDOM) {
			return;
		}

		const menu_overlay = document.createElement('div');
		menu_overlay.classList.add('menu_overlay');

		shadowDOM.appendChild(menu_overlay);

		const menu = document.createElement('div');
		menu.classList.add('cornerMenu');
		menu.dataset.theme = document.documentElement.dataset.theme ?? 'dark';

		menuItems.forEach((menuItem, index) => {
			if (!verifyUserPermissionLevel(permissionLevel, menuItem.permission)) {
				return;
			}
			menu.appendChild(this.generateMenuItem(menuItem, index + 1));
		});

		const userAvatar = document.createElement('img');
		userAvatar.src = user.avatar ?? 'https://seccdn.libravatar.org/static/img/mm/80.png';
		userAvatar.alt = `${user.name} - ${permissionLevel.charAt(0).toUpperCase() + permissionLevel.slice(1)}`;
		userAvatar.title = `${user.name} - ${permissionLevel.charAt(0).toUpperCase() + permissionLevel.slice(1)}`;
		userAvatar.setAttribute('width', '32');
		userAvatar.setAttribute('height', '32');
		userAvatar.setAttribute('aria-hidden', 'true');
		userAvatar.style.borderRadius = '50%';
		userAvatar.style.width = '100%';
		userAvatar.style.height = '100%';
		userAvatar.style.objectFit = 'cover';
		userAvatar.classList.add('avatar');

		menu.appendChild(userAvatar);

		shadowDOM.appendChild(menu);

		shadowDOM.innerHTML += `
            <style>
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
                    /* the threshold at which colors are considered "light." Range: integers from 0 to 100,
                    recommended 50 - 70 */
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
                    display: none;
                    position: fixed;
                    background: rgba(0,0,0,0.4);
                    top: 0%;
                    left: 0%;
                    width: 100%;
                    height: 100%;
                    z-index: 500;
                }
	
                .menuOpened.menu_overlay {
                    display: block;
                }

                .cornerMenu {
                    width: 50px;
                    height: 50px;
                    position: fixed;
                    right: 25px;
                    bottom: 25px;
                    background: hsl(var(--background-step-1));
                    box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.3);
                    border-radius: 50%;
                    border: 1px solid hsl(var(--border));
                    text-align: center;
                    line-height: 54px;
                    color: #fff;
                    font-size: 22px;
                    z-index: 600;
                    cursor: pointer;
                }

                .cornerMenu .avatar {
                    z-index: 700;
                }

                .menu {
                    /* Any lightness value below the threshold will result in white, any above will result in black */
                    --switch: calc((var(--light) - var(--threshold)) * -100%);
                    color: hsl(0, 0%, var(--switch));
                    width: 32px;
                    height: 32px;
                    position: absolute;
                    background-color: hsl(var(--background-step-2));
                    box-shadow: 0px 3px 7px 0px rgba(0, 0, 0, 0.10);
                    border-radius: 50%;
                    text-align: center;
                    line-height: 42px;
                    font-size: 16px;
                    top: -5px;
                    right: 0;
                    left: -5px;
                    margin: auto;
                    transform: translate(0, 0);
                    opacity: 0;
                    z-index: 550;
                    transition: all .4s ease-in-out;
                    padding: 8px;
                    border: 1px solid hsl(var(--border));
                    user-select: none;
                    pointer-events: none;
                    display: flex;
                    justify-content: center;
                    align-items: center;

                    svg {
                        width: 24px;
                        height: 24px;
                    }
                }

                .menuOpened .menu {
                    right: 0;
                    opacity: 1;
                    transition: transform .3s ease, opacity .3s ease, background-color .15s ease;
                    pointer-events: all;
                    user-select: all;
                    cursor: pointer;
                }
                
                .menuOpened .menu:hover {
                    background-color: hsl(var(--background-step-3));
                }

                .menuOpened .menu1 {
                    transform: translate(-105px, 20px);
                    transition-delay: 0s;
                }

                .menuOpened .menu2 {
                    transform: translate(-78px, -33px);
                    transition-delay: .05s;
                }

                .menuOpened .menu3 {
                    transform: translate(-38px, -76px);
                    transition-delay: .1s;
                }
                    
                .menuOpened .menu4 {
                    transform: translate(18px, -99px);
                    transition-delay: .15s;
                }

                .menu.logout {
                    color: hsl(var(--danger-base));
                }

                .menu.profile {
                    color: hsl(var(--primary-base));
                }

                .menu.dashboard {
                    color: hsl(var(--success-base));
                }

                .menu.edit {
                    color: hsl(var(--warning-base));
                }
            </style>
        `;
	}

	generateMenuItem(menuItem: MenuItem, index: number) {
		const menuItemElement = document.createElement('a');
		menuItemElement.classList.add('menu');
		menuItemElement.classList.add(`menu${index}`);
		menuItemElement.classList.add(menuItem.name.toLowerCase());
		menuItemElement.title = menuItem.name;
		menuItemElement.innerHTML = menuItem.svg;
		menuItemElement.href = menuItem.href;

		return menuItemElement;
	}

	async getSession(): Promise<GetSessionResponse | null> {
		const userResponse = await fetch('/studiocms_api/dashboard/verify-session', {
			method: 'POST',
		})
			.catch((error) => null)
			.then((response) => response);

		if (!userResponse || !userResponse.ok) {
			return null;
		}

		const data: GetSessionResponse = await userResponse.json();

		return data;
	}
}

document.addEventListener('DOMContentLoaded', () => {
	document.body.appendChild(document.createElement('user-quick-tools'));

	if (!customElements.get('user-quick-tools')) {
		customElements.define('user-quick-tools', UserQuickTools);
	}
});
