import * as THREE from 'three';

/**
 * Takes in a GLTF model and fits it into a camera's viewport.
 * @param model The model to fit
 * @param camera The camera to fit the model into
 */
function fitModelToViewport(
	model: THREE.Group<THREE.Object3DEventMap>,
	camera: THREE.PerspectiveCamera
): number {
	// Grab object's bounding box info
	const box = new THREE.Box3().setFromObject(model);
	const center = box.getCenter(new THREE.Vector3());
	const size = box.getSize(new THREE.Vector3());

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
