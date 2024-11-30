class SingleSidebarHelper {
	sidebar: HTMLElement;
	sidebarToggle?: HTMLElement | undefined;

	constructor(toggleID?: string) {
		const sidebarContainer = document.getElementById('sidebar');

		if (!sidebarContainer) {
			throw new Error(
				`No item with ID 'sidebar' found. Please add the <Sidebar> component to this page.`
			);
		}

		this.sidebar = sidebarContainer;

		if (toggleID) {
			const navToggle = document.getElementById(toggleID);

			if (!navToggle) {
				throw new Error(`No item with ID ${toggleID} found.`);
			}

			this.sidebarToggle = navToggle;

			this.sidebarToggle.addEventListener('click', () => {
				this.sidebar.classList.toggle('active');
			});
		}
	}

	public toggleSidebarOnClick = (elementID: string) => {
		const navToggle = document.getElementById(elementID);

		if (!navToggle) {
			throw new Error(`No item with ID ${elementID} found.`);
		}

		this.sidebarToggle = navToggle;

		this.sidebarToggle.addEventListener('click', () => {
			this.sidebar.classList.toggle('active');
		});
	}

	public hideSidebarOnClick = (elementID: string) => {
		const element = document.getElementById(elementID);

		if (!element) {
			throw new Error(`No item with ID ${elementID} found.`);
		}

		element.addEventListener('click', this.hideSidebar);
	};

	public showSidebarOnClick = (elementID: string) => {
		const element = document.getElementById(elementID);

		if (!element) {
			throw new Error(`No item with ID ${elementID} found.`);
		}

		element.addEventListener('click', this.showSidebar);
	};

	public hideSidebar = () => {
		this.sidebar.classList.remove('active');
	};

	public showSidebar = () => {
		this.sidebar.classList.add('active');
	};
}

class DoubleSidebarHelper {
	sidebarsContainer: HTMLElement;

	constructor() {
		const sidebarsContainer = document.getElementById('sidebars');

		if (!sidebarsContainer) {
			throw new Error(
				`No item with ID 'sidebars' found. Please add the <DoubleSidebar> component to this page.`
			);
		}

		this.sidebarsContainer = sidebarsContainer;
	}

	public hideSidebarOnClick = (elementID: string) => {
		const element = document.getElementById(elementID);

		if (!element) {
			throw new Error(`No item with ID ${elementID} found.`);
		}

		element.addEventListener('click', this.hideSidebar);
	};

	public showOuterOnClick = (elementID: string) => {
		const element = document.getElementById(elementID);

		if (!element) {
			throw new Error(`No item with ID ${elementID} found.`);
		}

		element.addEventListener('click', this.showOuterSidebar);
	};

	public showInnerOnClick = (elementID: string) => {
		const element = document.getElementById(elementID);

		if (!element) {
			throw new Error(`No item with ID ${elementID} found.`);
		}

		element.addEventListener('click', this.showInnerSidebar);
	};

	public showInnerSidebar = () => {
		this.sidebarsContainer.classList.add('inner', 'active');
	};

	public showOuterSidebar = () => {
		this.sidebarsContainer.classList.add('active');
		this.sidebarsContainer.classList.remove('inner');
	};

	public hideSidebar = () => {
		this.sidebarsContainer.classList.remove('inner', 'active');
	};
}

export { SingleSidebarHelper, DoubleSidebarHelper };
