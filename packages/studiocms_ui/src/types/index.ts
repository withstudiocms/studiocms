export type ToastProps = {
	title: string;
	/**
	 * This will get passed to the component as unsanitized HTML. DO NOT PUT USER-GENERATED CONTENT HERE!
	 */
	description?: string;
	type: 'success' | 'warning' | 'danger' | 'info';
	duration?: number;
	persistent?: boolean;
	closeButton?: boolean;
};
