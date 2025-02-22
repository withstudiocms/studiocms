/**
 * Creates a new window element with the specified content.
 *
 * @param content - The HTML content to be inserted into the window element.
 * @returns The newly created window element with the specified content.
 */
export function createWindowElement(content: string) {
	const windowElement = document.createElement('astro-dev-toolbar-window');
	windowElement.innerHTML = content;
	windowElement.placement = 'bottom-center';
	return windowElement;
}

/**
 * Attaches an event listener to the specified event target that listens for the 'app-toggled' event.
 * When the 'app-toggled' event is triggered, it adds or removes a click event listener on the document
 * based on the state provided in the event's detail.
 *
 * The click event listener will dispatch a 'toggle-app' event with `state: false` if the click occurs
 * outside of the specified elements or does not pass the additional check.
 *
 * @param eventTarget - The target to which the 'app-toggled' event listener is attached.
 * @param additionalCheck - An optional function that takes an Element and returns a boolean. If provided,
 *                          the click event listener will not dispatch the 'toggle-app' event if this function
 *                          returns true for the clicked target.
 */
export function closeOnOutsideClick(
	eventTarget: EventTarget,
	additionalCheck?: (target: Element) => boolean
) {
	interface AppToggledEventDetail {
		state: boolean;
	}

	const isCustomEvent = (event: Event): event is CustomEvent<AppToggledEventDetail> => {
		return 'detail' in event;
	};

	function onPageClick(event: MouseEvent) {
		const target = event.target as Element | null;
		if (!target) return;
		if (!target.closest) return;
		if (target.closest('astro-dev-toolbar')) return;
		if (additionalCheck?.(target)) return;
		eventTarget.dispatchEvent(
			new CustomEvent('toggle-app', {
				detail: {
					state: false,
				},
			})
		);
	}
	eventTarget.addEventListener('app-toggled', (event: Event) => {
		if (!isCustomEvent(event)) return;
		if (event.detail.state === true) {
			document.addEventListener('click', onPageClick, true);
		} else {
			document.removeEventListener('click', onPageClick, true);
		}
	});
}
