<!--
This component shows the 2D world map using Leaflet.js and OpenTopoMap tiles.

Parameters:
- lat, lon: focus point of the map
- zoom: zoom level (0-17)
- peaks: array of peaks to show
- selectedPeak: peak in focus
- minimap: if true disable input, controls, and markers
- geoJson: additional geometry to show

Events:
- click: emittend when the user clicks a peak marker
- move: emittend when the user moves in the map
-->

<template>
<div></div>
</template>

<script>
import L from 'leaflet';
import '@/../node_modules/leaflet/dist/leaflet.css';
import '@/../node_modules/leaflet.markercluster/dist/MarkerCluster.css';
import '@/../node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// scale ratio of a selected marker
const activeIconScaling = 1.7;
// width and height of the markers
const iconSize = [18, 30];
const iconSizeSelected = [iconSize[0] * activeIconScaling, iconSize[1] * activeIconScaling];
// anchor position of the markers
const iconAnchor = [iconSize[0] / 2, iconSize[1]];
const iconAnchorSelected = [iconSizeSelected[0] / 2, iconSizeSelected[1]];

/**
 * Marker icons, each is related to the array 'sourceColors' in CompositeMap.
 */
const markerIcons = [
	new L.Icon({
		iconUrl: require('@/assets/marker-icon-green.png'),
		iconSize,
		iconAnchor
	}),
	new L.Icon({
		iconUrl: require('@/assets/marker-icon-blue.png'),
		iconSize,
		iconAnchor
	}),
	new L.Icon({
		iconUrl: require('@/assets/marker-icon-red.png'),
		iconSize,
		iconAnchor
	}),
	new L.Icon({
		iconUrl: require('@/assets/marker-icon-grey.png'),
		iconSize,
		iconAnchor
	}),
	new L.Icon({
		iconUrl: require('@/assets/marker-icon-yellow.png'),
		iconSize,
		iconAnchor
	}),
	new L.Icon({
		iconUrl: require('@/assets/marker-icon-violet.png'),
		iconSize,
		iconAnchor
	}),
	new L.Icon({
		iconUrl: require('@/assets/marker-icon-black.png'),
		iconSize,
		iconAnchor
	}),
	new L.Icon({
		iconUrl: require('@/assets/marker-icon-orange.png'),
		iconSize,
		iconAnchor
	})
]

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
		zoom: {
			type: Number,
			default: 14
		},
		peaks: {
			type: Array,
			default() {
				return [];
			}
		},
		clustering: {
			type: Boolean,
			default: false
		},
		minimap: { // if true disable input, controls, and markers
			type: Boolean,
			default: false
		},
		selectedPeak: {
			type: Object,
			default: null
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
			/** @type {L.Map} */
			/* map: undefined */ // do not add because it is too heavy to be tracked by Vue
			/** @type {L.Control} */
			zoomControl: undefined,
			/** @type {L.LayerGroup} */
			markersLayer: undefined,
			/** @type {Object.<number, Object>} */
			peaksMarker: {}, // associates every peak ID to its marker
			/** @type {L.GeoJson} */
			geojsonLayer: undefined,
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		/**
		 * Returns an object that associates each source to a marker icon.
		 * @returns {Object.<string, L.Icon>}
		 */
		sourceToIcon() {
			let numIcons = 0;
			let sourceToIcon = {};
			this.peaks.forEach(peak => {
				if (sourceToIcon[peak.source_id] === undefined) {
					sourceToIcon[peak.source_id] = markerIcons[numIcons++];
					if (numIcons >= markerIcons.length) {
						console.error('More sources than available icons!');
						numIcons = 0;
					}
				}
			});
			return sourceToIcon;
		}
	},

	/**
	 * Called after the component instance has been mounted.
	 */
	mounted() {
		// create a new Leaflet map
		let map = L.map(this.$el, { zoomControl: false });
		// initial position
		map.setView([this.lat, this.lon], this.zoom);
		// add zoom control
		this.zoomControl = L.control.zoom({ position: 'bottomright' }).addTo(map);
		// set OpenTopoMap tiles
		L.tileLayer(
			'http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
			{
				maxZoom: 17,
				attribution: 'Map data: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>,\
					<a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> \
					(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
			}
		).addTo(map);
		
		// register handler to emit a Vue event when the camera moves
		map.on('moveend', () => {
			let center = this.map.getCenter();
			let position = {
				lat: center.lat,
				lon: center.lng
			}
			this.$emit('move', position);
		});
		
		// register handler to restore the selected marker size
		map.on('zoomend', () => {
			if (this.selectedPeak && this.peaksMarker[this.selectedPeak.id]) {
				increaseMarkerSize(this.peaksMarker[this.selectedPeak.id]);
			}
		});

		setInterval(() => map.invalidateSize(), 1000);
		this.map = map;
		// initial setup
		this.updateMinimapState();
		this.updateGeoJsonLayer();
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Focus the map on the given point.
		 * @param {number} lat
		 * @param {number} lon
		 * @param {number} [zoom] - Integer between [0-17]
		 */
		lookAt(lat, lon, zoom) {
			this.map.setView([this.lat, this.lon], zoom || this.zoom);
		},

		/**
		 * Removes the GeoJson layer.
		 */
		removeGeoJsonLayer() {
			if (this.geojsonLayer) {
				this.map.removeLayer(this.geojsonLayer);
				this.geojsonLayer = undefined;
			}
		},

		/**
		 * Removes all markers.
		 */
		removeMarkers() {
			if (this.markersLayer) {
				this.map.removeLayer(this.markersLayer);
				this.markersLayer = undefined;
				this.peaksMarker = {};
			}
		},
	
		/**
		 * Updates the visible markers
		 */
		updateMarkers() {
			this.removeMarkers();

			/** @type {L.Layer} */
			let markersLayer = undefined;

			if (this.clustering === true) {
				markersLayer = L.markerClusterGroup({
					animate: false,
					showCoverageOnHover: false,
					spiderfyOnMaxZoom: true,
					disableClusteringAtZoom: 12
				});
			} else {
				markersLayer = L.layerGroup();
			}

			this.peaks.forEach(peak => {
				let icon = this.sourceToIcon[peak.source_id];

				// check if the peak overrides the default marker icon
				if (peak.markerColorId) {
					icon = markerIcons[peak.markerColorId];
				}
				
				const marker = L.marker(
					[peak.lat, peak.lon],
					{
						icon: Object.create(icon),
						alt: peak.name
					}
				);
				marker.on('click', ev => {
					this.$emit('click', peak);
				});
				markersLayer.addLayer(marker);
				// save peak-marker link
				this.peaksMarker[peak.id] = marker;
			});

			markersLayer.addTo(this.map);
			this.markersLayer = markersLayer;

			// increase size of the selected marker
			if (this.selectedPeak && this.peaksMarker[this.selectedPeak.id]) {
				increaseMarkerSize(this.peaksMarker[this.selectedPeak.id]);
			}
		},

		/**
		 * Updates the map appearance according to the minimap flag.
		 */
		updateMinimapState() {
			let map = this.map;
			let leafletAttrDiv = document.getElementsByClassName('leaflet-control-attribution')[0];
			if (this.minimap === true) {
				leafletAttrDiv.style.display = 'none';
				map.removeControl(this.zoomControl);
				map.boxZoom.disable();
				map.doubleClickZoom.disable();
				map.dragging.disable();
				map.keyboard.disable();
				map.scrollWheelZoom.disable();
				map.touchExtend.disable();
				map.touchZoom.disable();
				this.removeMarkers();
				this.removeGeoJsonLayer();
			} else {
				leafletAttrDiv.style.display = 'block';
				map.addControl(this.zoomControl);
				map.boxZoom.enable();
				map.doubleClickZoom.enable();
				map.dragging.enable();
				map.keyboard.enable();
				map.scrollWheelZoom.enable();
				map.touchExtend.enable();
				map.touchZoom.enable();
				this.updateMarkers();
				this.updateGeoJsonLayer();
			}
		},

		/**
		 * Updates the GeoJsonLayer
		 */
		updateGeoJsonLayer() {
			this.removeGeoJsonLayer();
			this.geojsonLayer = L.geoJSON(
				this.geoJson,
				{
					color: "red",
					weight: 5,
					fillColor: "DodgerBlue"
				}
			);
			this.geojsonLayer.addTo(this.map);
		}
	},

	/**
	 * Custom watchers.
	 */
	watch: {
		/**
		 * Updates the map when lat changes.
		 */
		lat() {
			this.map.setView([this.lat, this.lon], this.zoom);
		},

		/**
		 * Updates the map when lon changes.
		 */
		lon() {
			this.map.setView([this.lat, this.lon], this.zoom);
		},

		/**
		 * Updates the map when the zoom changes.
		 */
		zoom() {
			this.map.setView([this.lat, this.lon], this.zoom);
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
		 * Updates the map appearance when the minimap flag changes.
		 */
		minimap() {
			this.updateMinimapState();
		},

		/**
		 * Increases the current peak's size and resets the previous peak's size
		 */
		selectedPeak(peak, oldPeak) {
			if (oldPeak && this.peaksMarker[oldPeak.id]) {
				resetMarkerSize(this.peaksMarker[oldPeak.id]);
			}
			if (peak && this.peaksMarker[peak.id]) {
				increaseMarkerSize(this.peaksMarker[peak.id]);
			}
		},

		/**
		 * Updates the GeoJson layer.
		 */
		geoJson() {
			if (this.minimap === false) {
				this.updateGeoJsonLayer();
			}
		}
	}
}

function resetMarkerSize(marker) {
	marker.options.icon.options.iconSize = iconSize;
	marker.options.icon.options.iconAnchor = iconAnchor;
	// HACK: change CSS to make the change immediate
	if (marker._icon) {
		let style = marker._icon.style;
		style.width = iconSize[0] + "px";
		style.height = iconSize[1] + "px";
		style.marginLeft = -iconAnchor[0] + "px";
		style.marginTop = -iconAnchor[1] + "px";
	}
}

function increaseMarkerSize(marker) {
	// duplicate child object to avoid all markers to change size
	marker.options = Object.create(marker.options);
	marker.options.icon = Object.create(marker.options.icon);
	marker.options.icon.options = Object.create(marker.options.icon.options);
	// increase size
	marker.options.icon.options.iconSize = iconSizeSelected;
	marker.options.icon.options.iconAnchor = iconAnchorSelected;
	// HACK: change CSS to make the change immediate
	if (marker._icon) {
		let style = marker._icon.style;
		style.width = iconSizeSelected[0] + "px";
		style.height = iconSizeSelected[1] + "px";
		style.marginLeft = -iconAnchorSelected[0] + "px";
		style.marginTop = -iconAnchorSelected[1] + "px";
		style.zIndex = 5000;
	}
}
</script>
