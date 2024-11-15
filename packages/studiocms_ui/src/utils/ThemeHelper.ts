type Theme = 'dark' | 'light' | 'system';
type ThemeChangeCallback = (newTheme: Theme, oldTheme: Theme) => void;

/**
 * A helper to toggle, set and get the current StudioCMS UI theme.
 */
class ThemeHelper {
  private themeManagerElement: HTMLElement;
  private observer: MutationObserver | undefined;
  private themeChangeCallbacks: ThemeChangeCallback[] = [];

  /**
   * A helper to toggle, set and get the current StudioCMS UI theme.
   * @param themeProvider The element that should carry the data-theme attribute (replaces the document root)
   */
  constructor(themeProvider?: HTMLElement) {
    this.themeManagerElement = themeProvider || document.documentElement;
  }

  /**
   * Get the current theme.
   * @param {boolean} resolveSystemTheme Whether to resolve the `system` theme to the actual theme (`dark` or `light`)
   * @returns {Theme} The current theme.
   */
  public getTheme = <T extends boolean>(resolveSystemTheme?: T): T extends true ? 'dark' | 'light' : Theme => {
    const theme = this.themeManagerElement.dataset.theme as Theme || 'system';

    if (!resolveSystemTheme) {
      // Side note: Don't ask me why this type wizardry is needed but it gives proper return types so I don't care
      return theme as T extends true ? 'dark' | 'light' : Theme; 
    }
    
    if (this.themeManagerElement.dataset.theme !== 'system')  {
      return this.themeManagerElement.dataset.theme as 'dark' | 'light';
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    // This should (in theory) never happen since, at time of writing, window.matchMedia is supported
    // by 96.83% of all browsers in use. (https://caniuse.com/mdn-api_window_matchmedia)
    throw new Error('Unable to resolve theme. (Most likely cause: window.matchMedia is not supported by the browser)');
  };

  /**
   * Sets the current theme.
   * @param theme The new theme. One of `dark`, `light` or `system`.
   */
  public setTheme = (theme: Theme): void => {
    this.themeManagerElement.dataset.theme = theme;
  };

  /**
   * Toggles the current theme. 
   * 
   * If the theme is set to `system` (or no theme is set via the root element),
   * the theme is set depending on the user's color scheme preference (set in the browser).
   */
  public toggleTheme = (): void => {
    const theme = this.getTheme();

    if (theme === 'dark') {
      this.setTheme('light');
      return;
    }

    if (theme === 'light') {
      this.setTheme('dark');
      return;
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('light');
      return;
    }

    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      this.setTheme('dark');
      return;
    }
  };

  /**
   * Register an element to act as a toggle! When clicked, it will toggle the theme.
   * @param toggle The HTML element that should act as the toggle
   */
  public registerToggle = (toggle: HTMLElement | null): void => {
    if (!toggle) {
      console.error('Element passed to toggle registration does not exist.');
      return;
    };

    toggle.addEventListener('click', this.toggleTheme);
  };

  /**
   * Allows for adding a callback that gets called whenever the theme changes,
   * @param callback The callback to be executed
   */
  public onThemeChange = (callback: ThemeChangeCallback): void => {
    if (!this.observer) {
      this.observer = new MutationObserver(this.themeManagerMutationHandler);
      this.observer.observe(this.themeManagerElement, { attributes: true, attributeOldValue: true, attributeFilter: ['data-theme'] });
    }

    this.themeChangeCallbacks.push(callback);
  };

  /**
   * Simply gets the first mutation and calls all registered callbacks. 
   * @param mutations The mutations array from the observer. Due to the specified options, this will always be a 1-length array,
   */
  private themeManagerMutationHandler = (mutations: MutationRecord[]): void => {
    if (!mutations[0]) return;

    for (const callback of this.themeChangeCallbacks) {
      callback(this.getTheme(), mutations[0].oldValue as Theme || 'system');
    }
  };
}

export { ThemeHelper, type Theme };
