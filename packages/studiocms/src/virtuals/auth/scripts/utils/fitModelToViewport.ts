// Import only what's needed from Three.js
/** biome-ignore-all lint/suspicious/noExplicitAny: This file uses explicit any for dynamic compatibility */
import { Box3, Vector3 } from 'three';

/**
 * Takes in a GLTF model and fits it into a camera's viewport.
 * Optimized to work with dependency injection pattern.
 * @param model The model to fit
 * @param camera The camera to fit the model into
 * @param threeModules Optional Three.js modules (for dependency injection)
 */
function fitModelToViewport(
	model: any, // Using any to support both bundled and injected Three.js
	camera: any,
	threeModules?: any
): number {
	// Use injected modules if available, otherwise fall back to imports
	const ThreeBox3 = threeModules?.Box3 || Box3;
	const ThreeVector3 = threeModules?.Vector3 || Vector3;

	// Grab object's bounding box info (ensure world matrices are current)
	if (typeof (model as any).updateWorldMatrix === 'function') {
		model.updateWorldMatrix(true, true);
	} else if (typeof (model as any).updateMatrixWorld === 'function') {
		model.updateMatrixWorld(true);
	}
	const box = new ThreeBox3().setFromObject(model);
	const center = box.getCenter(new ThreeVector3());
	const size = box.getSize(new ThreeVector3());

	// Adjust model position relative to the center of the bounding box
	model.position.x += model.position.x - center.x;
	model.position.y += model.position.y - center.y;
	model.position.z += model.position.z - center.z;

	// Change the camera's position to fit the model
	const maxDim = Math.max(size.x, size.y, size.z);
	const fov = camera.fov * (Math.PI / 180);
	let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

	// Change distance from camera to model
	cameraZ *= 2.5;
	camera.position.z = cameraZ;

	camera.updateProjectionMatrix();

	return cameraZ;
}

export { fitModelToViewport };
