import { Cartesian3 } from 'cesium';

export function rad2deg(radians)
{
	return radians * 180 / Math.PI;
}

export function deg2rad(degrees)
{
	return degrees * Math.PI / 180;
}

/**
 * Computes the camera angle relative to the north in degrees.
 * @param {Cesium.Camera} camera 
 */
export function computeCameraAngle(camera)
{
	let orthogonal = new Cartesian3(); // |camera.position|
	Cartesian3.normalize(camera.position, orthogonal);
	let projected = new Cartesian3(); // |camera.direction| - orthogonal * (orthogonal . camera.direction)
	Cartesian3.multiplyByScalar(orthogonal, Cartesian3.dot(orthogonal, camera.direction), projected);
	Cartesian3.subtract(camera.direction, projected, projected);
	let angle = Cartesian3.angleBetween(Cartesian3.UNIT_Z, projected);
	return rad2deg(angle);
}

/**
 * Computes the average of an array of numbers.
 * @param {number[]} array
 */
export function average(array) {
	if (array.length === 0) return 0;
	return array.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / array.length;
}
