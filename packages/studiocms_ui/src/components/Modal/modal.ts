class ModalHelper {
	public element: HTMLDialogElement;
	public cancelButton: HTMLButtonElement | undefined;
	public confirmButton: HTMLButtonElement | undefined;

	private isForm = false;
	private modalForm: HTMLFormElement;

	constructor(id: string, triggerID?: string) {
		const element = document.getElementById(id) as HTMLDialogElement;

		if (!element) {
			throw new Error(`No modal with ID ${id} found.`);
		}

		this.element = element as HTMLDialogElement;
		this.modalForm = document.getElementById(`${id}-form-element`) as HTMLFormElement;

		const isDismissable = this.element.dataset.dismissable === 'true';
		const isForm = this.element.dataset.form === 'true';

		if (isDismissable) {
			this.addDismissiveClickListener();
		}

		if (isForm) this.isForm = true;

		this.addButtonListeners(id, isDismissable);

		if (triggerID) {
			this.bindTrigger(triggerID);
		}
	}

	private addButtonListeners = (id: string, dismissable: boolean) => {
		if (dismissable || !this.element.dataset.buttons) {
			const xMarkButton = document.getElementById(`${id}-btn-x`) as HTMLButtonElement;
			xMarkButton.addEventListener('click', this.hide);
		}

		if (!this.element.dataset.buttons) return;

		const usedButtons = this.element.dataset.buttons.split(';');

		if (usedButtons.includes('cancel')) {
			this.cancelButton = document.getElementById(`${id}-btn-cancel`) as HTMLButtonElement;
			this.cancelButton.addEventListener('click', this.hide);
		}

		if (usedButtons.includes('confirm')) {
			this.confirmButton = document.getElementById(`${id}-btn-confirm`) as HTMLButtonElement;
			this.confirmButton.addEventListener('click', this.hide);
		}
	};

	private addDismissiveClickListener = () => {
		this.element.addEventListener('click', (e: MouseEvent) => {
			if (!e.target) return;

			const { left, right, top, bottom } = this.element.getBoundingClientRect();

			const clickWithinModalBox =
				e.clientX < right && e.clientX > left && e.clientY < bottom && e.clientY > top;

			if (!clickWithinModalBox) {
				this.element.close();
			}
		});
	};

	public show = () => {
		this.element.showModal();
	};

	public hide = () => {
		this.element.close();
	};

	public bindTrigger = (elementID: string) => {
		const element = document.getElementById(elementID);

		if (!element) {
			throw new Error(`No element with ID ${elementID} found.`);
		}

		element.addEventListener('click', this.show);
	};

	public registerCancelCallback = (func: () => void) => {
		if (!this.cancelButton) {
			throw new Error('Unable to register cancel callback without a cancel button.');
		}

		this.cancelButton.removeEventListener('click', this.hide);

		this.cancelButton.addEventListener('click', () => {
			func();
			this.hide();
		});
	};

	public registerConfirmCallback = (func: (data?: FormData | undefined) => void) => {
		if (!this.confirmButton) {
			throw new Error('Unable to register cancel callback without a confirmation button.');
		}

		this.confirmButton.removeEventListener('click', this.hide);

		if (this.isForm) {
			this.modalForm.addEventListener('submit', (e) => {
				e.preventDefault();

				const formData = new FormData(this.modalForm);

				func(formData);
				this.hide();

				setTimeout(() => this.modalForm.reset(), 450);
			});
		} else {
			this.confirmButton.addEventListener('click', () => {
				func();
				this.hide();
			});
		}
	};
}

export { ModalHelper };
