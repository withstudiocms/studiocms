import type { ToastProps } from '../../types';

/**
 * A function to create toasts with.

 * @param props The props to pass to the toast
 */
function toast(props: ToastProps) {
	const createToast = new CustomEvent('createtoast', {
		detail: props,
	});

	document.dispatchEvent(createToast);
}

export { toast };
