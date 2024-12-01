class DropdownHelper {
	container: HTMLDivElement;
	toggleEl: HTMLDivElement;
	dropdown: HTMLUListElement;

	alignment: 'start' | 'center' | 'end';
	triggerOn: 'left' | 'right' | 'both';
	active = false;
	fullWidth = false;

	constructor(id: string, fullWidth?: boolean) {
		this.container = document.getElementById(`${id}-container`) as HTMLDivElement;

		if (!this.container) {
			throw new Error(`Unable to find dropdown with ID ${id}.`);
		}

		this.alignment = this.container.dataset.align as 'start' | 'center' | 'end';
		this.triggerOn = this.container.dataset.trigger as 'left' | 'right' | 'both';

		this.toggleEl = document.getElementById(`${id}-toggle-btn`) as HTMLDivElement;
		this.dropdown = document.getElementById(`${id}-dropdown`) as HTMLUListElement;

		if (this.triggerOn === 'left') {
			this.toggleEl.addEventListener('click', this.toggle);
		} else if (this.triggerOn === 'both') {
			this.toggleEl.addEventListener('click', this.toggle);
			this.toggleEl.addEventListener('contextmenu', (e) => {
				e.preventDefault();
				this.toggle();
			});
		} else {
			this.toggleEl.addEventListener('contextmenu', (e) => {
				e.preventDefault();
				this.toggle();
			});
		}

		if (fullWidth) this.fullWidth = true;

		window.addEventListener('scroll', this.hide);
		document.addEventListener('astro:before-preparation', () => {
			this.dropdown.classList.remove('initialized');
		});

		this.hideOnClickOutside(this.container);

		this.initialOptClickRegistration();
	}

	public registerClickCallback = (func: (value: string) => void) => {
		const dropdownOpts = this.dropdown.querySelectorAll('li');

		for (const opt of dropdownOpts) {
			opt.removeEventListener('click', this.hide);

			opt.addEventListener('click', () => {
				func(opt.dataset.value || '');
				this.hide();
			});
		}
	};

	private initialOptClickRegistration = () => {
		const dropdownOpts = this.dropdown.querySelectorAll('li');

		for (const opt of dropdownOpts) {
			opt.addEventListener('click', this.hide);
		}
	};

	public toggle = () => {
		if (this.active) {
			this.hide();
			return;
		}

		this.show();
	};

	public hide = () => {
		this.dropdown.classList.remove('active');
		this.active = false;

		setTimeout(() => this.dropdown.classList.remove('above', 'below'), 200);
	};

	public show = () => {
		const isMobile = window.matchMedia('screen and (max-width: 840px)').matches;

		const {
			bottom,
			left,
			right,
			width: parentWidth,
			x,
			y,
			height,
		} = this.toggleEl.getBoundingClientRect();
		const { width: dropdownWidth } = this.dropdown.getBoundingClientRect();

		const optionHeight = 44;
		const totalBorderSize = 2;
		const margin = 4;

		const dropdownHeight = this.dropdown.children.length * optionHeight + totalBorderSize + margin;

		const CustomRect = {
			top: bottom + margin,
			left,
			right,
			bottom: bottom + margin + dropdownHeight,
			width: isMobile || this.fullWidth ? parentWidth : dropdownWidth, // Account for scaling of animation
			height: dropdownHeight,
			x,
			y: y + height + margin,
		};

		this.active = true;

		if (isMobile || this.fullWidth) {
			this.dropdown.style.maxWidth = `${parentWidth}px`;
			this.dropdown.style.minWidth = 'unset';
			this.dropdown.style.width = `${parentWidth}px`;
			this.dropdown.style.left = `calc(${parentWidth / 2}px - ${CustomRect.width / 2}px)`;
		} else {
			if (this.alignment === 'end') {
				this.dropdown.style.left = `calc(${parentWidth}px - ${CustomRect.width}px)`;
			}

			if (this.alignment === 'center') {
				this.dropdown.style.left = `calc(${parentWidth / 2}px - ${CustomRect.width / 2}px)`;
			}
		}

		if (!this.dropdown.classList.contains('initialized')) {
			this.dropdown.classList.add('initialized');
		}

		if (
			CustomRect.top >= 0 &&
			CustomRect.left >= 0 &&
			CustomRect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			CustomRect.right <= (window.innerWidth || document.documentElement.clientWidth)
		) {
			this.dropdown.classList.add('active', 'below');
		} else {
			this.dropdown.classList.add('active', 'above');
		}
	};

	private hideOnClickOutside = (element: HTMLElement) => {
		const outsideClickListener = (event: MouseEvent) => {
			if (!event.target) return;

			if (!element.contains(event.target as Node) && isVisible(element) && this.active === true) {
				// or use: event.target.closest(selector) === null
				this.hide();
			}
		};

		document.addEventListener('click', outsideClickListener);
	};
}

export { DropdownHelper };

// source (2018-03-11): https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js
const isVisible = (elem: HTMLElement) =>
	!!elem && !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
