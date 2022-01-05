<!--
This component shows a 2D map and allows the user to select a custom area.
Bind 'v-model' to receive the vertices of the area in the format [[lon1, lat1], ..,  [lonN, latN]].
Bind 'source' and/or 'source2' to see a random selection of peaks from those sources.

Parameters:
- value (v-model): the vertices of the area in the format [[lon1, lat1], ..,  [lonN, latN]].
- source: primary peak source.
- source2: reference peak source.
- nopeaksindicator: whether the number of selected peaks is visible

-->
<template>
<div></div>
</template>

<script>
import L from 'leaflet';
import api from '@/assets/api';
import locale from '@/assets/localization';
import 'leaflet-draw';
import '../../node_modules/leaflet-draw/dist/leaflet.draw.css';

const iconSize = [18, 30];
const iconAnchor = [iconSize[0] / 2, iconSize[1]];
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
	})
]

export default {
	/**
	 * Component properties.
	 */
	props: {
		nopeaksindicator: Boolean, // if true do not show the selected peak indicator
		source: String,
		source2: String,
		value: Array // input area
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			area: [],
			infoControl: undefined, // info panel
		}
	},

	/**
	 * Called after the component instance has been mounted.
	 */
	mounted() {
		let map = L.map(this.$el, { zoomControl: false });
		// add zoom control in the top right
		L.control.zoom({
			position:'bottomleft'
		}).addTo(map);
		// initial position
		map.setView([45.801263, 9.092747], 6);
		// set OpenTopoMap tiles
		L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
			maxZoom: 17,
			attribution: 'Map data: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>,\
				<a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> \
				(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
		}).addTo(map);

		// panel to show the number of peaks selected
		var infoControl = L.control();
		infoControl.onAdd = function (map) {
			this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
			this.update(0);
			return this._div;
		};
		infoControl.update = function (numPeaks) {
			if (numPeaks === 0) this._div.innerHTML = 'No peaks selected';
			else if (numPeaks === -1) this._div.innerHTML = 'The area is too big';
			else this._div.innerHTML = `${numPeaks} peaks selected`;
		};
		if (!this.nopeaksindicator) infoControl.addTo(map);
		this.infoControl = infoControl;

		// layer to store the markers
		let markersGroup = new L.FeatureGroup().addTo(map);
		// layer to store the drawings
		let drawnItems = new L.FeatureGroup().addTo(map);

		// draw control creation
		let drawControl = new L.Control.Draw({
			draw: {
				polygon: {
					allowIntersection: false, // determines if line segments can cross
					drawError: {
						color: 'red',
						message: locale.line_intersection_error
					},
				},
				// disable the following tools
				polyline: false,
				circle: false,
				circlemarker: false,
				rectangle: false,
				marker: false,
			},
			edit: {
				featureGroup: drawnItems,
				remove: false
			}
		}).addTo(map);

		// handlers for the leaflet events
		map.on('draw:drawstart', () => {
			// force only 1 drawing to persist
			drawnItems.clearLayers();
			let needRefresh = this.area.length >= 0; // refresh if there was a previous selection
			this.area = [];
			this.$emit('input', this.area);
			if (needRefresh) this.refresh();
		});
		map.on('draw:created', e => {
			drawnItems.addLayer(e.layer);
			let area = e.layer.toGeoJSON().geometry.coordinates[0];
			this.area = area;
			this.$emit('input', area);
			this.refresh();
		});
		map.on('draw:edited', (e) => {
			e.layers.eachLayer(layer => {
				let area = layer.toGeoJSON().geometry.coordinates[0];
				this.area = area;
				this.$emit('input', area);
				this.refresh();
			});
		});
		map.on('zoomend', () => {
			if (this.area.length == 0) this.refresh();
		});
		map.on('moveend', () => {
			if (this.area.length == 0) this.refresh();
		});

		// save references
		this.map = map;
		this.infoControl = infoControl;
		this.drawnItems = drawnItems;
		this.markersGroup = markersGroup;
		// set initial area
		if (this.value && this.value.length) {
			this.updateArea()
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Reload the peaks contained in the current view.
		 */
		refresh() {
			 // remove existing markers
			this.markersGroup.clearLayers();

			// use the selected area or the map bounds
			let area;
			if (this.area.length > 0) {
				area = this.area;
			} else {
				area = boundsToArea(this.map.getBounds());
			}

			if (this.source) {
				api.sources.getInfo(this.source, area)
				.then(info => {
					// create and add markers
					info.sample_peaks.forEach(peak => {
						let marker = L.marker([peak.lat, peak.lon], { icon: markerIcons[0] });
						marker.bindPopup(peak.name || peak.id);
						this.markersGroup.addLayer(marker);
					});
					// update info
					if (this.area.length === 0) {
						this.infoControl.update(0);
					} else if (info.num_peaks === undefined) {
						this.infoControl.update(-1);
					} else {
						this.infoControl.update(info.num_peaks);
					}
				})
				.catch(err => {
					console.error(err);
				});
			}

			if (this.source2) {
				api.sources.getInfo(this.source2, area)
				.then(info => {
					// create and add markers
					info.sample_peaks.forEach(peak => {
						let marker = L.marker([peak.lat, peak.lon], { icon: markerIcons[1] });
						marker.bindPopup(peak.name || peak.id);
						this.markersGroup.addLayer(marker);
					});
				})
				.catch(err => {
					console.error(err);
				});
			}
		},
		
		/**
		 * Updates the selected area.
		 */
		updateArea() {
			this.drawnItems.clearLayers();
			if (this.area.length > 0) {
				let coords = this.area.map(x => [x[1], x[0]]); // [lon, lat] -> [lat, lon]
				let polygon = L.polygon(coords);
				this.drawnItems.addLayer(polygon);
				this.map.fitBounds(polygon.getBounds());
			}
		}
	},

	/**
	 * Custom watchers.
	 */
	watch: {
		source() {
			if (this.area.length === 0) {
				// center the view on the source
				api.sources.getInfo(this.source)
				.then(info => {
					if (this.area.length == 0) {
						let bbox = info.bbox.split(',').map(x => parseFloat(x));
						this.map.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
					}
				})
				.catch(err => {
					console.error(err);
				});
			}
			this.refresh();
		},

		source2() {
			this.refresh();
		},

		value() {
			this.area = this.value ? this.value : [];
			this.updateArea();
			this.refresh();
		}
	},
}

/**
 * Converts a Leaflet LatLngBounds object to an area in the format: [[lon1, lat1], ..., [lon4, lat4]
 * @param {L.LatLngBounds} b
 * @returns {number[][]}
 */
function boundsToArea(b) {
	let w = b.getWest();
	let s = b.getSouth();
	let e = b.getEast();
	let n = b.getNorth();
	return [[w, s], [e, s], [e, n], [w, n]];
}
</script>

<style>
.info {
	padding: 6px 8px;
	font: 14px/16px Arial, Helvetica, sans-serif;
	background: white;
	background: rgba(255,255,255,0.8);
	box-shadow: 0 0 15px rgba(0,0,0,0.2);
	border-radius: 5px;
}
</style>
