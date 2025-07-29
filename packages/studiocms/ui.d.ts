declare module 'studiocms:ui/version' {
	const version: string;
	export default version;
}

declare module 'studiocms:ui/global-css' {}

declare module 'studiocms:ui/custom-css' {}

declare module 'studiocms:ui/scripts/*' {}

declare module 'studiocms:ui/components' {
	export const Button: typeof import('@studiocms/ui/components/Button/Button.astro').default;
	export const Divider: typeof import('@studiocms/ui/components/Divider/Divider.astro').default;
	export const Input: typeof import('@studiocms/ui/components/Input/Input.astro').default;
	export const Row: typeof import('@studiocms/ui/components/Row/Row.astro').default;
	export const Center: typeof import('@studiocms/ui/components/Center/Center.astro').default;
	export const Textarea: typeof import('@studiocms/ui/components/Textarea/Textarea.astro').default;
	export const Checkbox: typeof import('@studiocms/ui/components/Checkbox/Checkbox.astro').default;
	export const Toggle: typeof import('@studiocms/ui/components/Toggle/Toggle.astro').default;
	export const RadioGroup: typeof import('@studiocms/ui/components/RadioGroup/RadioGroup.astro').default;
	export const Toaster: typeof import('@studiocms/ui/components/Toast/Toaster.astro').default;
	export const Card: typeof import('@studiocms/ui/components/Card/Card.astro').default;
	export const Modal: typeof import('@studiocms/ui/components/Modal/Modal.astro').default;
	export const Select: typeof import('@studiocms/ui/components/Select/Select.astro').default;
	export const SearchSelect: typeof import('@studiocms/ui/components/SearchSelect/SearchSelect.astro').default;
	export const Dropdown: typeof import('@studiocms/ui/components/Dropdown/Dropdown.astro').default;
	export const User: typeof import('@studiocms/ui/components/User/User.astro').default;
	export const ThemeToggle: typeof import('@studiocms/ui/components/ThemeToggle/ThemeToggle.astro').default;
	export const Tabs: typeof import('@studiocms/ui/components/Tabs/Tabs.astro').default;
	export const TabItem: typeof import('@studiocms/ui/components/Tabs/TabItem.astro').default;
	export const Accordion: typeof import('@studiocms/ui/components/Accordion/Accordion.astro').default;
	export const AccordionItem: typeof import('@studiocms/ui/components/Accordion/Item.astro').default;
	export const Footer: typeof import('@studiocms/ui/components/Footer/Footer.astro').default;
	export const Progress: typeof import('@studiocms/ui/components/Progress/Progress.astro').default;
	export const Sidebar: typeof import('@studiocms/ui/components/Sidebar/Single.astro').default;
	export const DoubleSidebar: typeof import('@studiocms/ui/components/Sidebar/Double.astro').default;
	export const Breadcrumbs: typeof import('@studiocms/ui/components/Breadcrumbs/Breadcrumbs.astro').default;
	export const Group: typeof import('@studiocms/ui/components/Group/Group.astro').default;
	export const Badge: typeof import('@studiocms/ui/components/Badge/Badge.astro').default;
	export const Icon: typeof import('@studiocms/ui/components/Icon/Icon.astro').default;
	export const IconBase: typeof import('@studiocms/ui/components/Icon/IconBase.astro').default;
	export const toast: typeof import('@studiocms/ui/components/Toast/toast.js').toast;
	export type HeroIconName = import('@studiocms/ui/components/Icon/iconType.js').HeroIconName;

	export class ModalHelper {
		private element;
		private cancelButton;
		private confirmButton;
		private isForm;
		private modalForm;
		/**
		 * A helper to manage modals.
		 * @param id The ID of the modal.
		 * @param triggerID The ID of the element that should trigger the modal.
		 */
		constructor(id: string, triggerID?: string);
		/**
		 * A helper function which adds event listeners to the modal buttons to close the modal when clicked.
		 * @param id The ID of the modal.
		 * @param dismissible Whether the modal is dismissible.
		 */
		private addButtonListeners;
		/**
		 * A helper function to close the modal when the user clicks outside of it.
		 */
		private addDismissiveClickListener;
		/**
		 * A function to show the modal.
		 */
		show: () => void;
		/**
		 * A function to hide the modal.
		 */
		hide: () => void;
		/**
		 * A function to add another trigger to show the modal with.
		 * @param elementID The ID of the element that should trigger the modal when clicked.
		 */
		bindTrigger: (elementID: string) => void;
		/**
		 * Registers a callback for the cancel button.
		 * @param func The callback function.
		 */
		registerCancelCallback: (func: () => void) => void;
		/**
		 * Registers a callback for the confirm button.
		 * @param func The callback function. If the modal is a form, the function will be called with
		 * the form data as the first argument.
		 */
		registerConfirmCallback: (func: (data?: FormData | undefined) => void) => void;
	}

	export class DropdownHelper {
		private container;
		private toggleEl;
		private dropdown;
		private alignment;
		private triggerOn;
		private fullWidth;
		private focusIndex;
		active: boolean;
		/**
		 * A helper function to interact with dropdowns.
		 * @param id The ID of the dropdown.
		 * @param fullWidth Whether the dropdown should be full width. Not needed normally.
		 */
		constructor(id: string, fullWidth?: boolean);
		/**
		 * Registers a click callback for the dropdown options. Whenever one of the options
		 * is clicked, the callback will be called with the value of the option.
		 * @param func The callback function.
		 */
		registerClickCallback: (func: (value: string) => void) => void;
		/**
		 * Sets up all listeners for the dropdown.
		 */
		private initialBehaviorRegistration;
		/**
		 * Registers callbacks to hide the dropdown when an option is clicked.
		 */
		private initialOptClickRegistration;
		/**
		 * A function to toggle the dropdown.
		 */
		toggle: () => void;
		/**
		 * A function to hide the dropdown.
		 */
		hide: () => void;
		/**
		 * A function to show the dropdown.
		 */
		show: () => void;
		/**
		 * A jQuery-like function to hide the dropdown when clicking outside of it.
		 * @param element The element to hide when clicking outside of it.
		 */
		private hideOnClickOutside;
	}

	export class ProgressHelper {
		private bar;
		private progress;
		private value;
		private max;
		constructor(id: string);
		getValue(): number;
		setValue(value: number): void;
		getMax(): number;
		setMax(value: number): void;
		getPercentage(): number;
	}

	export class SingleSidebarHelper {
		private sidebar;
		private sidebarToggle?;
		/**
		 * A helper to manage the sidebar with.
		 * @param toggleID The ID of the element that should toggle the sidebar.
		 */
		constructor(toggleID?: string);
		/**
		 * A helper function register an element which should toggle the sidebar.
		 * @param elementID The ID of the element that should toggle the sidebar.
		 */
		toggleSidebarOnClick: (elementID: string) => void;
		/**
		 * A helper function to hide the sidebar when an element is clicked.
		 * @param elementID The ID of the element that should hide the sidebar.
		 */
		hideSidebarOnClick: (elementID: string) => void;
		/**
		 * A helper function to show the sidebar when an element is clicked.
		 * @param elementID The ID of the element that should show the sidebar.
		 */
		showSidebarOnClick: (elementID: string) => void;
		/**
		 * A function to hide the sidebar.
		 */
		hideSidebar: () => void;
		/**
		 * A function to show the sidebar.
		 */
		showSidebar: () => void;
	}

	export class DoubleSidebarHelper {
		private sidebarsContainer;
		/**
		 * A helper to manage the double sidebar with.
		 */
		constructor();
		/**
		 * A helper function to hide the sidebar when an element is clicked.
		 * @param elementID The ID of the element that should hide the sidebar.
		 */
		hideSidebarOnClick: (elementID: string) => void;
		/**
		 * A helper function to show the outer sidebar when an element is clicked.
		 * @param elementID The ID of the element that should show the outer sidebar.
		 */
		showOuterOnClick: (elementID: string) => void;
		/**
		 * A helper function to show the inner sidebar when an element is clicked.
		 * @param elementID The ID of the element that should show the inner sidebar.
		 */
		showInnerOnClick: (elementID: string) => void;
		/**
		 * A function to show the inner sidebar.
		 */
		showInnerSidebar: () => void;
		/**
		 * A function to show the outer sidebar.
		 */
		showOuterSidebar: () => void;
		/**
		 * A function to hide the sidebar altogether.
		 */
		hideSidebar: () => void;
	}
}

declare module 'studiocms:ui/utils' {
	export type Theme = import('@studiocms/ui/utils/ThemeHelper.js').Theme;

	type ThemeChangeCallback = (newTheme: Theme, oldTheme: Theme) => void;

	/**
	 * A helper to toggle, set and get the current StudioCMS UI theme.
	 */
	export class ThemeHelper {
		private themeManagerElement;
		private observer;
		private themeChangeCallbacks;
		/**
		 * A helper to toggle, set and get the current StudioCMS UI theme.
		 * @param themeProvider The element that should carry the data-theme attribute (replaces the document root)
		 */
		constructor(themeProvider?: HTMLElement);
		/**
		 * Get the current theme.
		 * @param {boolean} resolveSystemTheme Whether to resolve the `system` theme to the actual theme (`dark` or `light`)
		 * @returns {Theme} The current theme.
		 */
		getTheme: <T extends boolean>(
			resolveSystemTheme?: T
		) => T extends true ? 'dark' | 'light' : Theme;
		/**
		 * Sets the current theme.
		 * @param theme The new theme. One of `dark`, `light` or `system`.
		 */
		setTheme: (theme: Theme) => void;
		/**
		 * Toggles the current theme.
		 *
		 * If the theme is set to `system` (or no theme is set via the root element),
		 * the theme is set depending on the user's color scheme preference (set in the browser).
		 */
		toggleTheme: () => void;
		/**
		 * Register an element to act as a toggle! When clicked, it will toggle the theme.
		 * @param toggle The HTML element that should act as the toggle
		 */
		registerToggle: (toggle: HTMLElement | null) => void;
		/**
		 * Allows for adding a callback that gets called whenever the theme changes.
		 * @param callback The callback to be executed
		 */
		onThemeChange: (callback: ThemeChangeCallback) => void;
		/**
		 * Simply gets the first mutation and calls all registered callbacks.
		 * @param mutations The mutations array from the observer. Due to the specified options, this will always be a 1-length array,
		 */
		private themeManagerMutationHandler;
	}
}
