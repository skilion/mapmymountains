<!--
This component shows a 2D world map using Leaflet.js and OpenTopoMap tiles.

Parameters:
- lat, lon: focus point of the map
- height: camera height from the ground
- peaks: array of peaks to show
- selectedPeak: peak in focus
- minimap: if true disable input, controls, and markers
- geoJson: additional geometry to show
- noLabels: flag to hide peak names

Events:
- click: emittend when the user clicks a peak marker
- move: emittend when the user moves in the map
-->

<template>
<div></div>
</template>

<script>
import Cesium from 'cesium';
import CesiumNavigation from 'cesium-navigation';
import config from '@/config.json';
import localization from '@/assets/localization';
import * as math from '@/assets/math';
import '@/../node_modules/cesium-navigation/Source/Styles/cesium-navigation.less';
import 'Cesium/Widgets/widgets.css';

// current active camera movements (keyboard)
let flags = {
	moveForward: false,
	moveBackward: false,
	moveLeft: false,
	moveRight: false,
	zoomIn: false,
	zoomOut: false
}

// set Cesium Ion access token
Cesium.Ion.defaultAccessToken = config.cesium_ion_access_token;

// color for polygon of GeoJson geometry
const TRANSPARENT_DODGER_BLUE = new Cesium.Color(.11, .56, 1, .3);

const MARKER_SIZE = [18, 30];
const SELECTED_MARKER_SCALE = 1.7;
const MARKER_DISABLE_DEPTH_TEST_DISTANCE = 1e3; // distance from the camera at which to disable the depth test to
const LABEL_DISABLE_DEPTH_TEST_DISTANCE = 2e3;
const LABEL_TRANSLUCENCY_BY_DISTANCE = new Cesium.NearFarScalar(10e3, 1.0, 20e3, 0); // near and far translucency properties

// marker images
const markerImages = [
	require('@/assets/marker-icon-green.png'),
	require('@/assets/marker-icon-blue.png'),
	require('@/assets/marker-icon-red.png'),
	require('@/assets/marker-icon-grey.png'),
	require('@/assets/marker-icon-yellow.png'),
	require('@/assets/marker-icon-violet.png'),
	require('@/assets/marker-icon-black.png'),
	require('@/assets/marker-icon-orange.png')
];

export default {
	/**
	 * Component properties.
	 */
	props: {
		lat: {
			type: Number,
			default: 45.801263,
		},
		lon: {
			type: Number,
			default: 9.092747
		},
		height: {
			type: Number,
			default: 1500
		},
		peaks: {
			type: Array,
			default() {
				return [];
			}
		},
		selectedPeak: {
			type: Object,
			default: null
		},
		rotate: {
			type: Boolean,
			default: false
		},
		noLabels: {
			type: Boolean,
			default: true
		},
		minimap: { // if true disable input, controls, and markers
			type: Boolean,
			default: false
		},
		geoJson: {
			type: Object,
			default: null
		}
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			/*viewer: Cesium.Viewer*/ //  do not add because it is too heavy to be tracked by Vue
			rotationButtonDiv: null, // HTMLElement
			rotation: false, // true if rotating around the current peak
			unsubscribeRotation: null, // call to remove the rotation routine from Cesium

			/** @type {Object.<number, Cesium.Billboard>} */
			peaksBillboard: {} // associates every peak ID to its marker
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		/**
		 * Returns an object that associates each source to a marker image.
		 * @returns {Object.<string, string>}
		 */
		sourceToImage() {
			let numImages = 0;
			let sourceToImage = {};
			this.peaks.forEach(peak => {
				if (sourceToImage[peak.source_id] === undefined) {
					sourceToImage[peak.source_id] = markerImages[numImages++];
					if (numImages >= markerImages.length) {
						console.error('More sources than available icons!');
						numImages = 0;
					}
				}
			});
			return sourceToImage;
		}
	},

	/**
	 * Called after the component instance has been mounted.
	 */
	mounted() {
		let viewer = new Cesium.Viewer(this.$el, {
			scene3DOnly: true,
			requestRenderMode: true,
			terrainProvider: config.terrain_provider
				? new Cesium.CesiumTerrainProvider({ url: config.terrain_provider })
				: Cesium.createWorldTerrain({}),
			animation: false,
			baseLayerPicker: false,
			fullscreenButton: false,
			geocoder: false,
			homeButton: false,
			infoBox: false,
			sceneModePicker: false,
			selectionIndicator: false,
			timeline: false,
			navigationHelpButton: false,
			navigationInstructionsInitiallyVisible: false
		});

		// enable depth test against terrain
		viewer.scene.globe.depthTestAgainstTerrain = true;

		// enable debug inspector
		if (config.debug_info) {
			viewer.extend(Cesium.viewerCesiumInspectorMixin);
		}
		
		// add cesium-navigation plugin
		viewer.extend(CesiumNavigation, {
			defaultResetView: Cesium.Rectangle.fromDegrees(-9.492188, 36.421282, 27.641602, 55.002826), // get values with http://bboxfinder.com
			enableDistanceLegend: false
		});

		// allow to take focus and receive key events
		let canvas = viewer.canvas;
		canvas.setAttribute('tabindex', '0');
		canvas.onclick = () => { canvas.focus() };

		// register handler for key events
		canvas.addEventListener('keydown', event => {
		let flagName = getFlagForKey(event);
			if (flagName) {
				event.preventDefault();
				flags[flagName] = true;
			}
		}, false);
		canvas.addEventListener('keyup', event => {
		let flagName = getFlagForKey(event);
			if (flagName) {
				event.preventDefault();
				flags[flagName] = false;
			}
		}, false);

		// periodically move the camera according to movement flags
		viewer.clock.onTick.addEventListener(() => {
			let camera = viewer.camera;
			let cameraHeight = viewer.scene.globe.ellipsoid.cartesianToCartographic(camera.position).height;
			updateCameraPosition(camera, cameraHeight);
		});

		// register handler to emit a Vue event when the camera moves
		viewer.camera.moveEnd.addEventListener(() => {
			let pos = viewer.camera.positionCartographic;
			let point = {
				lat: math.rad2deg(pos.latitude),
				lon: math.rad2deg(pos.longitude),
				height: pos.height,
				angle: math.rad2deg(viewer.camera.heading)
			}
			this.$emit('move', point);
		});

		// register an handler to detect clicks on the 3D map
		let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
		handler.setInputAction(this.onLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		// create element for the rotation button
		let rotationButtonDiv = document.createElement('div');
		rotationButtonDiv.className = 'cesium-rotation-button';
		rotationButtonDiv.textContent = localization.rotate_on;
		rotationButtonDiv.addEventListener("click", () => {
			this.rotation = !this.rotation;
		}, false);
		viewer.cesiumWidget.container.appendChild(rotationButtonDiv);
		this.rotationButtonDiv = rotationButtonDiv;
		// save viewer object
		this.viewer = viewer;
		// initial setup
		this.updateMinimapState();
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Set the rotation around the current peak.
		 */
		enterRotation() {
			let viewer = this.viewer;
			getTerrainHeight(this.lat, this.lon, viewer.terrainProvider)
			.then(height => {
				if (!this.rotation) return; // check if the rotation flag was toggled since the async call
				let camera = viewer.camera;
				const start = new Date();
				if (this.unsubscribeRotation) {
					this.unsubscribeRotation();
					this.unsubscribeRotation = undefined;
				}
				// roatate the camera with function called periodically by Cesium
				this.unsubscribeRotation = viewer.clock.onTick.addEventListener(() => {
					const now = new Date()
					const time = now.getTime() - start.getTime();
					const heading = time / 200 % 360; // 200 provides a good speed
					const offset = new Cesium.HeadingPitchRange(math.deg2rad(heading), math.deg2rad(-25), height + 700);
					const target = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, height);
					viewer.camera.lookAt(target, offset);
				});
			})
			// update UI controls
			viewer.cesiumNavigation.container.style.display = 'none';
			this.rotationButtonDiv.textContent = localization.rotate_off;
		},

		/**
		 * Set the free exploration mode.
		 */
		exitRotation() {
			let viewer = this.viewer;
			if (this.unsubscribeRotation) {
				this.unsubscribeRotation();
				this.unsubscribeRotation = undefined;
			}
			this.lookAt(this.lat, this.lon);
			// update UI controls
			if (!this.minimap) {
				viewer.cesiumNavigation.container.style.display = 'block';
			}
			this.rotationButtonDiv.textContent = localization.rotate_on;
		},

		/**
		 * Move the camera to look from above at the given coordinates.
		 * @param {number} lat
		 * @param {number} lon
		 */
		lookAt(lat, lon) {
			if (this.rotation && !this.minimap) {
				// update rotation position
				this.enterRotation()
				return;
			}
			let now = Date.now();
			this.lookAtTimestamp = now;
			getTerrainHeight(lat, lon, this.viewer.terrainProvider)
			.then(terrainHeight => {
				if (this.lookAtTimestamp !== now) return; // another call was made
 				lookAt(this.viewer, lat, lon, terrainHeight || 0, this.height);
			}, err => {
				console.error(err);
				lookAt(this.viewer, lat, lon, 0, this.height);
			});
		},

		/**
		 * Called when the user clicks on the map.
		 * @param {Object} click
		 */
		onLeftClick(click) {
			let pickedObject = this.viewer.scene.pick(click.position);
			if (Cesium.defined(pickedObject)) {
				if (pickedObject.id !== undefined) {
					let peakId = pickedObject.id;
					// find the peak object
					let index = this.peaks.map(x => x.id).indexOf(peakId);
					// send a 'click' event with the peak object as parameter
					this.$emit('click', this.peaks[index]);
				}
			}
		},

		/**
		 * Removes all markers.
		 */
		removeMarkers() {
			let viewer = this.viewer;
			this.peaksBillboard = {};

			if (this.labelPrimitives) {
				this.labelPrimitives.forEach(x => viewer.scene.primitives.remove(x));
			}
			if (this.billboardPrimitives) {
				this.billboardPrimitives.forEach(x => viewer.scene.primitives.remove(x));
			}
			this.labelPrimitives = [];
			this.billboardPrimitives = [];
		},

		/**
		 * Updates the visible markers.
		 */
		updateMarkers() {
			let viewer = this.viewer;
			this.removeMarkers();

			// create and add markers in chunks to avoid hanging the UI
			const CHUNK_SIZE = 100;
			let peaks = this.peaks;
			let peaksIdx = 0;
			function processPeaks() {
				if (peaksIdx >= peaks.length) return;
				const currIndex = peaksIdx;
				getTerrainHeightPeaks(peaks.slice(peaksIdx, peaksIdx + CHUNK_SIZE), viewer.terrainProvider)
				.then(samples => {
					if (peaks !== this.peaks) {
						// peaks have changed while querying the heights
						return;
					}
					
					let labels = new Cesium.LabelCollection({ scene: viewer.scene });
					let billboards = new Cesium.BillboardCollection({ scene: viewer.scene });
					for (let i = currIndex, j = 0; i < (currIndex + CHUNK_SIZE); i++, j++) {
						if (i >= peaks.length) break;

						let peak = peaks[i];
						let label = this.noLabels ? '' : peak.name;
						let image = this.sourceToImage[peak.source_id];
						let height = samples[j].height;

						// check if the peak overrides the default marker image
						if (peak.markerColorId) {
							image = markerImages[peak.markerColorId];
						}

						// build marker
						let marker = createMarker(peak.id, peak.lat, peak.lon, height, label, image);
						if (this.selectedPeak === peak) setFocusedBillboardAppearance(marker.billboard);

						// save references
						if(!this.noLabels) labels.add(marker.label);
						this.peaksBillboard[peak.id] = billboards.add(marker.billboard);
					}
					viewer.scene.primitives.add(labels);
					viewer.scene.primitives.add(billboards);

					// save references
					this.labelPrimitives.push(labels);
					this.billboardPrimitives.push(billboards);

					// process the remaining peaks
					processPeaks.call(this);
				})
				.catch(err => console.error(err));

				// increment index
				peaksIdx += CHUNK_SIZE;
			}

			// begin processing peaks
			processPeaks.call(this);
		},

		/**
		 * Removes the extra GeoJson.
		 */
		removeGeoJson() {
			let viewer = this.viewer;
			viewer.dataSources.remove(this.geoJsonDataSource);
			this.geoJsonDataSource = undefined;
		},

		/**
		 * Updates the rendered GeoJson.
		 */
		updateGeoJson() {
			this.removeGeoJson();
			if (!this.geoJson) return;
			
			let viewer = this.viewer;
			Cesium.GeoJsonDataSource.load(
				this.geoJson,
				{
					fill: TRANSPARENT_DODGER_BLUE,
					stroke: Cesium.Color.RED,
					strokeWidth: 5,
					clampToGround: true
				}
			).then(dataSource => {
				this.geoJsonDataSource = dataSource;
				viewer.dataSources.add(dataSource);
				// force to update the image
				viewer.scene.requestRender();
			}, err => console.error(err));
		},

		/**
		 * Updates the map appearance according to the minimap flag.
		 */
		updateMinimapState() {
			let viewer = this.viewer;
			let screenSpaceCameraController = viewer.scene.screenSpaceCameraController;
			if (this.minimap === true) {
				screenSpaceCameraController.enableLook = false;
				screenSpaceCameraController.enableRotate = false;
				screenSpaceCameraController.enableTilt = false;
				screenSpaceCameraController.enableTranslate = false;
				screenSpaceCameraController.enableZoom = false;
				this.rotationButtonDiv.style.display = 'none';
				viewer.cesiumNavigation.container.style.display = 'none';
				viewer.cesiumWidget.creditContainer.style.display = 'none';
				if (config.debug_info) {
					viewer.cesiumInspector.container.style.display = 'none';
					viewer.scene.debugShowFramesPerSecond = false;
				}
				this.exitRotation();
				this.removeGeoJson();
				this.removeMarkers();
			} else {
				screenSpaceCameraController.enableLook = true;
				screenSpaceCameraController.enableRotate = true;
				screenSpaceCameraController.enableTilt = true;
				screenSpaceCameraController.enableTranslate = true;
				screenSpaceCameraController.enableZoom = true;
				this.rotationButtonDiv.style.display = 'block';
				viewer.cesiumNavigation.container.style.display = 'block';
				viewer.cesiumWidget.creditContainer.style.display = 'block';
				if (config.debug_info) {
					viewer.cesiumInspector.container.style.display = 'block';
					viewer.scene.debugShowFramesPerSecond = true;
				}
				if (this.rotation) {
					this.enterRotation();
				}
				this.updateGeoJson();
				this.updateMarkers();
			}
			this.lookAt(this.lat, this.lon);
		}
	},

	/**
	 * Custom watchers.
	 */
	watch: {
		/**
		 * Updates the camera when lat changes.
		 */
		lat() {
			this.lookAt(this.lat, this.lon);
		},

		/**
		 * Updates the camera when lon changes.
		 */
		lon() {
			this.lookAt(this.lat, this.lon);
		},

		/**
		 * Updates the camera when height changes.
		 */
		height() {
			this.lookAt(this.lat, this.lon);
		},

		/**
		 * Updates the markers when the peaks change.
		 */
		peaks: {
			deep: true,
			handler() {
				if (!this.minimap) this.updateMarkers();
			}
		},

		/**
		 * Copy rotate property.
		 */
		rotate: {
			immediate: true,
			handler(value) {
				this.rotation = value;
			}
		},

		/**
		 * Enable/disable rotation.
		 */
		rotation(value) {
			if (value) {
				this.enterRotation();
			} else {
				this.exitRotation();
			}
		},

		/**
		 * Updates the marker of the selected peak.
		 * @param {Object} peak - The new selected peak.
		 * @param {Object} oldPeak - The previously selected peak.
		 */
		selectedPeak(peak, oldPeak) {
			if (oldPeak) {
				let oldBillboard = this.peaksBillboard[oldPeak.id];
				if (oldBillboard) resetBillboardAppearance(oldBillboard);
			}
			if (peak) {
				let billboard = this.peaksBillboard[peak.id];
				if (billboard) setFocusedBillboardAppearance(billboard);
			}
		},

		/**
		 * Updates the markers.
		 */
		noLabels() {
			this.updateMarkers();
		},

		/**
		 * Updates the map appearance when the minimap flag changes.
		 */
		minimap() {
			this.updateMinimapState();
		},

		/**
		 * Updates the rendered GeoJson when it changes.
		 * @param {GeoJson} value
		 */
		geoJson(value) {
			if (!this.minimap) this.updateGeoJson();
		}
	}

	/*setCameraPos(lat: number, lon: number, fly: boolean) {
		console.log('Map3D.setCameraPos()');
		getTerrainHeight(lat, lon)
		.then((samples: any) => {
			let pos = {
				destination: Cesium.Cartesian3.fromDegrees(lon, lat, samples[0].height + 2000),
				orientation: {
					heading: 0,
					pitch: math.deg2rad(-30),
					roll: 0
				}
			}
			if (fly) this.viewer.camera.flyTo(pos);
			else this.viewer.camera.setView(pos);
		}, (err: Error) => console.err(err));
	}
	}*/
}

/**
 * Move the camera to look from above at the given coordinates.
 * @param {Cesium.Viewer} viewer
 * @param {number} lat
 * @param {number} lon
 * @param {number} height
 */
function lookAt(viewer, lat, lon, targetHeight, cameraHeight) {
	let target = Cesium.Cartesian3.fromDegrees(lon, lat, targetHeight);
	let diff = Math.log(cameraHeight) / 200;// found empirically
	let cameraPos = Cesium.Cartesian3.fromDegrees(lon, lat - diff, targetHeight + cameraHeight);
	let direction = new Cesium.Cartesian3();
	Cesium.Cartesian3.subtract(target, cameraPos, direction);
	Cesium.Cartesian3.normalize(direction, direction);
	let right = new Cesium.Cartesian3();
	Cesium.Cartesian3.cross(direction, cameraPos, right)
	Cesium.Cartesian3.normalize(right, right);
	let up = new Cesium.Cartesian3();
	Cesium.Cartesian3.cross(right, direction, up)
	Cesium.Cartesian3.normalize(up, up);
	let pos = {
		destination: cameraPos,
		orientation: {
			direction,
			up
		}
	}
	viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY, cameraPos); // needed for exiting the rotation mode (resets the transform matrix)
	viewer.camera.setView(pos);
}

/**
 * Computes the camera focus point, where the camera is pointing on the earth.
 * @param {Cesium.Camera} camera - Camera.
 * @param {Cesium.Globe} globe - Globe.
 * @returns {Number[]|undefined} [lat, lon], or undefined if not pointing to the earth.
 */
/*function getCameraFocusPoint(viewer: Cesium.Viewer)
{
	let intersection = viewer.globe.pick(viewer.camera.direction, viewer.scene);
	if (intersection === undefined) return undefined;
	let position = viewer.globe.ellipsoid.cartesianToCartographic(intersection);
	let lat = math.rad2deg(position.latitude);
	let lon = math.rad2deg(position.longitude);
	return [lat, lon];
}*/

/**
 * Return the heights of an array of coordinates.
 * @param {number[][]} coords - Array of [[lat1, lon1], ..., [latX, lonX]].
 * @param {Cesium.TerrainProvider} terrainProvider - The terrain provider from which to query heights.
 */
function getTerrainHeightArray(coords, terrainProvider) {
	// pack Cesium promise in a standard JS promise
	return new Promise((resolve, reject) => {
		let pos = coords.map(c => Cesium.Cartographic.fromDegrees(c[1], c[0]));
		Cesium.sampleTerrainMostDetailed(terrainProvider, pos)
		.then(data => resolve(data), err => reject(err));
	});
}

/**
 * Return the heights of the given peaks by sampling the terrain.
 * The function caches the heights in the peaks themselves.
 * @param {Object[]} peaks 
 * @param {Cesium.TerrainProvider} terrainProvider
 */
function getTerrainHeightPeaks(peaks, terrainProvider) {
	let peaksWithoutHeight = peaks.filter(peak => peak._height == undefined);
	let coords = peaksWithoutHeight.map(peak => [peak.lat, peak.lon]);
	return getTerrainHeightArray(coords, terrainProvider)
	.then(heights => {
		peaksWithoutHeight.forEach((peak, i) => {
			peak._height = heights[i];
		});
		return peaks.map(peak => peak._height);
	})
}

/**
 * Return the height of a point on the globe.
 * @param {number} lat
 * @param {number} lon
 * @param {Cesium.TerrainProvider} terrainProvider - The terrain provider from which to query heights.
 */
function getTerrainHeight(lat, lon, terrainProvider)
{
	let pos = Cesium.Cartographic.fromDegrees(lon, lat);
	return Cesium.sampleTerrainMostDetailed(terrainProvider, [pos])
	.then(samples => samples[0].height);
}

/**
 * Creates the billboard and label for a marker.
 * @param {number} id
 * @param {number} lat
 * @param {number} lon
 * @param {number} height
 * @param {label} image
 * @param {string} image
 */
function createMarker(id, lat, lon, height, text, image) {
	let position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
	let marker = {
		billboard: {
			position,
			id,
			image,
			width: MARKER_SIZE[0],
			height: MARKER_SIZE[1],
			verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
			disableDepthTestDistance: 0, // depth test always ON
			//heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // does not work reliably
		},
		label: {
			position,
			text,
			font: '20px sans-serif',
			fillColor: Cesium.Color.WHITE,
			outlineColor: Cesium.Color.BLACK,
			outlineWidth: 2,
			style: Cesium.LabelStyle.FILL_AND_OUTLINE,
			horizontalOrigin: Cesium.VerticalOrigin.CENTER,
			verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
			disableDepthTestDistance: Number.POSITIVE_INFINITY, // depth test always OFF
			translucencyByDistance: LABEL_TRANSLUCENCY_BY_DISTANCE,
			//heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // does not work reliably
		}
	}
	return marker;
}

/**
 * Returns the movement associated to a key.
 * @param {KeyboardEvent} keyEvent
 */
function getFlagForKey(keyEvent) {
	switch (keyEvent.keyCode) {
		case 37: return 'moveLeft';
		case 38: return 'moveForward';
		case 39: return 'moveRight';
		case 40: return 'moveBackward';
	}
	switch (keyEvent.key) {
		case '+':
		case 'Add':
			return 'zoomIn';
		case '-':
		case 'Subtract':
			return 'zoomOut';
	}
	return null;
}

/**
 * Update the camera position according to the global movement flags.
 * @param {Cesium.Camera} camera
 * @param {number} cameraHeight - The distance between the camera and the ground.
 */
function updateCameraPosition(camera, cameraHeight) {
let moveRate = cameraHeight / 50.0;
let rotationSpeed = cameraHeight * 1e-9;
	if (flags.moveForward) camera.rotate(camera.right, rotationSpeed);
	if (flags.moveBackward) camera.rotate(camera.right, -rotationSpeed);
	if (flags.moveLeft) camera.rotate(camera.up, rotationSpeed);
	if (flags.moveRight) camera.rotate(camera.up, -rotationSpeed);
	if (flags.zoomIn) camera.moveForward(moveRate);
	if (flags.zoomOut) camera.moveBackward(moveRate);
}

/**
 * Set the appearance of the billboard to focused state.
 * @param {Cesium.Billobard} billboard
 */
function setFocusedBillboardAppearance(billboard) {
	billboard.scale = SELECTED_MARKER_SCALE;
}

/**
 * Set the appearance of the billboard to normal state.
 * @param {Cesium.Billobard} billboard
 */
function resetBillboardAppearance(billboard)  {
	billboard.scale = 1;
}
</script>

<style>
/* location of the FPS counter */
.cesium-performanceDisplay-defaultContainer {
	top: 1rem;
	right: auto;
	left: 2rem;
}
/* location of Cesium inspector */
.cesium-viewer-cesiumInspectorContainer {
	top: 10rem;
	right: 1rem;
}
.cesium-rotation-button {
	position: absolute;
	background-color: rgba(47, 53, 60, 0.8);
	border: 1px solid #555;
	color: white;
	bottom: 2rem;
	left: 0;
	right: 0;
	padding: 0 1rem 0 1rem;
	height: 2rem;
	width: 10rem;
	margin: 0 auto;
	font-size: 1rem;
	text-align: center;
	line-height: 2rem;
	vertical-align: middle;
	cursor: pointer;
}
.compass {
	top: auto !important;
	bottom: calc(2rem + 88px);
}
.navigation-controls {
	background-color: rgba(47, 53, 60, 0.8);
	top: auto !important;
	bottom: 2rem;
}
</style>
