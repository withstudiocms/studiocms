/** biome-ignore-all lint/style/noNonNullAssertion: This file is using non-null assertions */
/** biome-ignore-all lint/suspicious/noExplicitAny: This file is using explicit any types */
const configElement = document.getElementById('auth-pages-config');
const loginPageBackground =
	configElement instanceof HTMLDivElement ? configElement.dataset.config_background : undefined;
const loginPageCustomImage =
	configElement instanceof HTMLDivElement ? configElement.dataset.config_custom_image : undefined;
const currentMode =
	(document.documentElement as HTMLElement | null)?.dataset?.theme === 'light' ? 'light' : 'dark';

const studioCMS3DModel = 'https://cdn.studiocms.dev/studiocms-logo.glb';

/**
 * A valid image that can be used as a background for the StudioCMS Logo.
 */
interface ValidImage {
	readonly name: string;
	readonly label: string;
	readonly format: 'local' | 'web';
	readonly light: { src: string } | null;
	readonly dark: { src: string } | null;
}

/**
 * The parameters for the background image.
 */
type BackgroundParams = {
	background: string;
	customImageHref: string;
	mode: 'light' | 'dark';
};

/**
 * Parses the background image config.
 * @param imageName The name of the image to parse.
 */
function parseBackgroundImageConfig(imageName?: string | undefined): string {
	return imageName || 'studiocms-curves';
}

function parseToString(value: string | undefined | null): string {
	return value || '';
}

/**
 * The parameters for the background image config.
 */
const backgroundConfig: BackgroundParams = {
	background: parseBackgroundImageConfig(loginPageBackground),
	customImageHref: parseToString(loginPageCustomImage),
	mode: currentMode as 'light' | 'dark',
};

/**
 * Gets the background config based on the parameters.
 */
function getBackgroundConfig(config: BackgroundParams, validImages: ValidImage[]): ValidImage {
	return validImages.find((image) => image.name === config.background) || validImages[0];
}

/**
 * Selects the background based on the image.
 */
function bgSelector(image: ValidImage, params: BackgroundParams) {
	return image.format === 'web'
		? params.customImageHref
		: params.mode === 'dark'
			? image.dark?.src
			: image.light?.src;
}

/**
 * Lazy-loading wrapper for the StudioCMS 3D Logo
 */
class LazyStudioCMS3DLogo {
	private container: HTMLDivElement;
	private observer: IntersectionObserver;
	private loaded = false;
	private logoInstance: StudioCMS3DLogo | null = null;

	constructor(containerEl: HTMLDivElement) {
		this.container = containerEl;

		// Only load Three.js when the container comes into view
		this.observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !this.loaded) {
						this.loadThreeJS();
						this.loaded = true;
					}
				});
			},
			{ rootMargin: '100px' } // Start loading 100px before it comes into view
		);

		this.observer.observe(this.container);
	}

	private async loadThreeJS() {
		try {
			// Show loading state with some basic styling
			this.showLoadingState();

			// Dynamic import of all required modules
			const [
				threeModule,
				{ OutlinePass },
				{ GLTFLoader },
				{ RenderPass },
				{ EffectComposer },
				{ validImages },
				{ fitModelToViewport },
			] = await Promise.all([
				import('three'),
				import('three/addons/postprocessing/OutlinePass.js'),
				import('three/addons/loaders/GLTFLoader.js'),
				import('three/addons/postprocessing/RenderPass.js'),
				import('three/addons/postprocessing/EffectComposer.js'),
				import('../utils/validImages/index.js'),
				import('./utils/fitModelToViewport.js'),
			]);

			// Clear loading state
			this.container.innerHTML = '';

			// Create the modules object to pass to StudioCMS3DLogo
			const modules = {
				...threeModule,
				OutlinePass,
				GLTFLoader,
				RenderPass,
				EffectComposer,
				validImages,
				fitModelToViewport,
			};

			// Initialize the 3D logo
			this.logoInstance = new StudioCMS3DLogo(
				this.container,
				new threeModule.Color(0xaa87f4),
				window.matchMedia('(prefers-reduced-motion: reduce)').matches,
				getBackgroundConfig(backgroundConfig, validImages),
				modules
			);
		} catch (error) {
			console.error('Failed to load 3D experience:', error);
			this.showErrorState();
		}
	}

	private showLoadingState() {
		this.container.innerHTML = `
			<div class="loading-3d" style="
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 100%;
				min-height: 400px;
				color: var(--text-color, #666);
				font-family: system-ui, sans-serif;
			">
				<div class="loading-spinner" style="
					width: 40px;
					height: 40px;
					border: 3px solid var(--border-color, #e0e0e0);
					border-top: 3px solid var(--accent-color, #aa87f4);
					border-radius: 50%;
					animation: spin 1s linear infinite;
					margin-bottom: 16px;
				"></div>
				<p style="margin: 0; font-size: 14px;">Loading 3D experience...</p>
			</div>
			<style>
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			</style>
		`;
	}

	private showErrorState() {
		this.container.innerHTML = `
			<div class="error-3d" style="
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				height: 100%;
				min-height: 400px;
				color: var(--text-color, #666);
				font-family: system-ui, sans-serif;
			">
				<div style="
					font-size: 24px;
					margin-bottom: 8px;
					opacity: 0.5;
				">⚠️</div>
				<p style="margin: 0; font-size: 14px;">3D experience unavailable</p>
			</div>
		`;
		this.container.classList.add('loaded'); // Still mark as "loaded" to prevent layout shifts
	}

	destroy() {
		this.observer.disconnect();
		if (this.logoInstance) {
			this.logoInstance.dispose?.();
			this.logoInstance = null;
		}
	}
}

/**
 * Enhanced StudioCMS3DLogo that accepts modules as dependency injection
 */
class StudioCMS3DLogo {
	canvasContainer: HTMLDivElement;
	scene: any;
	camera: any;
	renderer: any;
	model: any | undefined;
	mouseX = 0;
	mouseY = 0;
	time: any;
	composer: any;
	outlinePass: any | undefined;
	outlinedObjects: any[] = [];
	defaultComputedCameraZ: number | undefined;
	BackgroundMesh: any | undefined;
	frustumHeight: number | undefined;
	frames = 0;
	fps = 0;
	lastTime = 0;
	lastFrameTimes: number[] = [];
	MAX_FRAME_TIMES_LENGTH = 2;
	private resizeHandler?: () => void;
	private mouseMoveHandler?: (ev: MouseEvent) => void;

	// Cache materials to avoid recreating them
	private glassMaterial: any | undefined;
	private modules: any;

	constructor(
		containerEl: HTMLDivElement,
		outlineColor: any,
		reducedMotion: boolean,
		image: ValidImage,
		modules: any
	) {
		this.modules = modules;
		const {
			Scene,
			PerspectiveCamera,
			WebGLRenderer,
			Color,
			AmbientLight,
			Clock,
			RenderPass,
			EffectComposer,
		} = modules;

		this.scene = new Scene();
		this.scene.background = new Color(0x101010);

		this.camera = new PerspectiveCamera(
			75,
			window.innerWidth / 2 / window.innerHeight,
			0.01,
			10000
		);

		// Optimize renderer settings
		this.renderer = new WebGLRenderer({
			antialias: false,
			powerPreference: 'high-performance',
			stencil: false,
			depth: true,
		});
		this.renderer.setSize(window.innerWidth / 2, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setClearColor(0x101010, 1);
		this.renderer.setAnimationLoop(this.animate);

		this.canvasContainer = containerEl;
		this.canvasContainer.appendChild(this.renderer.domElement);

		this.time = new Clock(true);
		this.composer = new EffectComposer(this.renderer);

		// Simplified lighting
		const light2 = new AmbientLight(0x606060);
		this.scene.add(light2);

		const renderScene = new RenderPass(this.scene, this.camera);
		this.composer.addPass(renderScene);

		this.registerLoadingCallback();
		this.loadLogoModel();
		this.addPostProcessing(true, outlineColor);
		this.addBackgroundImage(image);
		this.initListeners(reducedMotion);

		this.lastTime = performance.now();
		this.updateFPS();
	}

	updateFPS = () => {
		const now = performance.now();
		this.frames++;

		if (now - this.lastTime >= 1000) {
			this.fps = this.frames;
			this.frames = 0;
			this.lastTime = now;

			if (this.lastFrameTimes.length >= this.MAX_FRAME_TIMES_LENGTH) {
				this.lastFrameTimes.shift();
			}

			this.lastFrameTimes.push(this.fps);
		}

		if (this.lastFrameTimes.length === this.MAX_FRAME_TIMES_LENGTH) {
			const averageFPS =
				this.lastFrameTimes.reduce((a, b) => a + b, 0) / this.MAX_FRAME_TIMES_LENGTH;

			if (averageFPS < 24) {
				this.renderer.clear();
				this.renderer.domElement.remove();
				throw new Error(`Average FPS is below 24: ${averageFPS}`);
			}
		}
	};

	animate = () => {
		if (this.model && this.canvasContainer) {
			const { MathUtils } = this.modules;

			// Movement courtesy of Otterlord, easing courtesy of Louis Escher
			const targetRotationX =
				this.mouseY === 0
					? Math.PI / 2
					: 0.1 * ((this.mouseY / window.innerHeight) * Math.PI - Math.PI / 2) + Math.PI / 2;
			const targetRotationY =
				this.mouseX === 0
					? 0
					: 0.1 * ((this.mouseX / (window.innerWidth / 2)) * Math.PI - Math.PI / 2);

			const lerpFactor = 0.035;

			this.model.rotation.x = MathUtils.lerp(this.model.rotation.x, targetRotationX, lerpFactor);
			this.model.rotation.y = MathUtils.lerp(this.model.rotation.y, 0, lerpFactor);
			this.model.rotation.z = MathUtils.lerp(this.model.rotation.z, -targetRotationY, lerpFactor);
		}

		this.composer.render();
		this.updateFPS();
	};

	private getGlassMaterial() {
		if (!this.glassMaterial) {
			const { MeshPhysicalMaterial } = this.modules;
			this.glassMaterial = new MeshPhysicalMaterial({
				color: '#ffffff',
				roughness: 0.6,
				transmission: 1,
				opacity: 1,
				transparent: true,
				thickness: 0.5,
				envMapIntensity: 1,
				clearcoat: 1,
				clearcoatRoughness: 0.2,
				metalness: 0,
			});
		}
		return this.glassMaterial;
	}

	loadLogoModel = async () => {
		const { GLTFLoader, Mesh, fitModelToViewport } = this.modules;
		const loader = new GLTFLoader();

		try {
			const gltf = await loader.loadAsync(studioCMS3DModel);
			this.model = gltf.scene;

			const material = this.getGlassMaterial();

			this.model.traverse((child: any) => {
				if (child instanceof Mesh) {
					child.material = material;
				}
			});

			this.scene.add(this.model);
			this.model.rotation.set(Math.PI / 2, 0, 0);

			this.defaultComputedCameraZ = fitModelToViewport(this.model, this.camera);
			this.outlinedObjects.push(this.model);
		} catch (error) {
			console.error('Failed to load logo model:', error);
		}
	};

	addPostProcessing = (outlines: boolean, outlineColor: any) => {
		if (outlines) this.addOutlines(outlineColor);
	};

	addOutlines = (outlineColor: any) => {
		const { OutlinePass, Vector2, Color } = this.modules;

		this.outlinePass = new OutlinePass(
			new Vector2(window.innerWidth / 2, window.innerHeight),
			this.scene,
			this.camera
		);

		this.outlinePass.selectedObjects = this.outlinedObjects;
		this.outlinePass.edgeStrength = 1.5;
		this.outlinePass.edgeGlow = 0;
		this.outlinePass.edgeThickness = 0.0000000001;
		this.outlinePass.pulsePeriod = 0;
		this.outlinePass.visibleEdgeColor.set(outlineColor);
		this.outlinePass.hiddenEdgeColor.set(new Color(0xffffff));

		this.composer.addPass(this.outlinePass);
	};

	addBackgroundImage = async (image: ValidImage) => {
		const { TextureLoader, PlaneGeometry, MeshBasicMaterial, Mesh, MathUtils } = this.modules;
		const bgPositionZ = -5;

		if (!this.frustumHeight) {
			this.frustumHeight =
				9 *
				Math.tan(MathUtils.degToRad(this.camera.fov / 2)) *
				Math.abs(this.camera.position.z - bgPositionZ);
		}

		const loader = new TextureLoader();
		const bgUrl = bgSelector(image, backgroundConfig);

		if (!bgUrl) {
			console.error('ERROR: Invalid background URL');
			return;
		}

		try {
			const texture = await loader.loadAsync(bgUrl);
			const planeHeight = this.frustumHeight!;
			const planeWidth = planeHeight * (texture.source.data.width / texture.source.data.height);

			const bgGeo = new PlaneGeometry(planeWidth, planeHeight);
			const bgMat = new MeshBasicMaterial({ map: texture });

			this.BackgroundMesh = new Mesh(bgGeo, bgMat);
			this.BackgroundMesh.position.set(0, 0, bgPositionZ);
			this.scene.add(this.BackgroundMesh);
		} catch (error) {
			console.error('Failed to load background image:', error);
		}
	};

	initListeners = (reducedMotion: boolean) => {
		this.initResizeListener();
		if (!reducedMotion) {
			this.initMouseMoveListener();
		}
	};

	initResizeListener = () => {
		this.resizeHandler = () => {
			if (window.innerWidth > 850) {
				this.camera.aspect = window.innerWidth / 2 / window.innerHeight;
				this.camera.updateProjectionMatrix();

				this.renderer.setSize(window.innerWidth / 2, window.innerHeight);
				this.composer.setSize(window.innerWidth / 2, window.innerHeight);

				if (window.innerWidth < 1100 && this.defaultComputedCameraZ) {
					this.camera.position.set(
						this.camera.position.x,
						this.camera.position.y,
						this.defaultComputedCameraZ + 5
					);
				} else if (window.innerWidth >= 1100 && this.defaultComputedCameraZ) {
					this.camera.position.set(
						this.camera.position.x,
						this.camera.position.y,
						this.defaultComputedCameraZ
					);
				}
			}
		};
		window.addEventListener('resize', this.resizeHandler);
	};

	initMouseMoveListener = () => {
		this.mouseMoveHandler = (ev) => {
			this.mouseX = ev.clientX;
			this.mouseY = ev.clientY;
		};
		document.addEventListener('mousemove', this.mouseMoveHandler);
	};

	dispose = () => {
		this.renderer?.setAnimationLoop(null);
		if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
		if (this.mouseMoveHandler) document.removeEventListener('mousemove', this.mouseMoveHandler);
		if (this.outlinePass?.dispose) this.outlinePass.dispose();
		this.composer?.dispose?.();
		if (this.BackgroundMesh) {
			this.BackgroundMesh.material?.map?.dispose?.();
			this.BackgroundMesh.material?.dispose?.();
			this.BackgroundMesh.geometry?.dispose?.();
			this.scene.remove(this.BackgroundMesh);
			this.BackgroundMesh = undefined;
		}
		if (this.model) {
			this.model.traverse((child: any) => {
				child.geometry?.dispose?.();
				child.material?.map?.dispose?.();
				child.material?.dispose?.();
			});
			this.scene.remove(this.model);
			this.model = undefined;
		}
		this.glassMaterial?.dispose?.();
		this.renderer?.dispose?.();
		this.renderer?.domElement?.remove?.();
	};

	registerLoadingCallback = () => {
		const { DefaultLoadingManager } = this.modules;
		DefaultLoadingManager.onLoad = () => {
			this.canvasContainer.classList.add('loaded');
		};
	};

	recomputeGlassMaterial = () => {
		if (!this.model) return;

		const { Mesh } = this.modules;
		const material = this.getGlassMaterial();

		this.model.traverse((child: any) => {
			if (child instanceof Mesh) {
				child.material = material;
			}
		});
	};
}

// Initialize the lazy-loading 3D logo
const logoContainer = document.querySelector<HTMLDivElement>('#canvas-container');
const smallScreen = window.matchMedia('(max-width: 850px)').matches;

if (logoContainer && !smallScreen) {
	try {
		new LazyStudioCMS3DLogo(logoContainer);
	} catch (err) {
		console.error("ERROR: Couldn't create LazyStudioCMS3DLogo", err);
		logoContainer.classList.add('loaded');
	}
}
