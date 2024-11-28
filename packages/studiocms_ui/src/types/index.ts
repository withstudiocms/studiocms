export type ToastProps = {
	title: string;
	description?: string;
	type: 'success' | 'warning' | 'danger' | 'info';
	duration?: number;
	persistent?: boolean;
	closeButton?: boolean;
};
