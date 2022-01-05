<!--
This component shows a world map that allows the user to switch between the 2D
and 3D view. It also has the possiblity to show a legend.

Parameters:
- lat, lon: focus point of the map
- peaks: array of peaks to show
- selectedPeak: peak in focus
- legend: flag to show the legend (based on peaks.source_id)
- mode: set view mode, one of: '2D', '3D' or '3D-rotate'
- geoJson: additional geometry to show
- noLabels: flag to hide peak names

Events:
- click: emittend when the user clicks a peak marker
- move: emittend when the user moves in the map
-->

<template>
<div class="max-size">
	<div :class="{ 'max-size': viewMode === '2D', 'view-mode-toggle': viewMode === '3D' }" @click="viewMode === '3D' && switchViewMode()">
		<Map2D
			class="max-size"
			ref="map2D"
			:lat="map2DLat"
			:lon="map2DLon"
			:zoom="viewMode === '2D' ? 14 : 2"
			:peaks="peaks"
			:minimap="viewMode === '3D'"
			:selectedPeak="selectedPeak"
			:geoJson="geoJson"
			@click="$emit('click', $event)"
			@move="onMap2DMove">
		</Map2D>
	</div>
	<div :class="{ 'max-size': viewMode === '3D', 'view-mode-toggle': viewMode === '2D' }" @click="viewMode === '2D' && switchViewMode()">
		<Map3D
			class="max-size"
			ref="map3D"
			:lat="map3DLat"
			:lon="map3DLon"
			:height="viewMode === '3D' ? 1500 : 2e6"
			:peaks="peaks"
			:rotate="rotate3D"
			:selectedPeak="selectedPeak"
			:noLabels="noLabels"
			:minimap="viewMode === '2D'"
			:geoJson="geoJson"
			@click="$emit('click', $event)"
			@move="onMap3DMove">user
		</Map3D>
	</div>
	<div class="legend" v-if="legend">
		<div v-for="(color, source) in sourceToColor" :key="source">
			<i :style="`background: ${sourceToColor[source]}`"></i> {{source}}
		</div>
	</div>
</div>
</template>

<script>
import Map2D from '@/components/Map2D.vue';
import Map3D from '@/components/Map3D.vue';

export default {
	/**
	 * Locally registered components.
	 */
	components: {
		Map2D,
		Map3D
	},

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
		noLabels: {
			type: Boolean,
			default: false
		},
		legend: {
			type: Boolean,
			default: false
		},
		mode: {
			type: String,
			default: '3D'
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
			viewMode: '2D', // current active map: '2D' or '3D'
			rotate3D: false, // rotate 3D map
			map2DLat: 0,
			map2DLon: 0,
			map2DZoom: 14,
			map3DLat: 0,
			map3DLon: 0
		}
	},

	/**
	 * Called after the component instance is created.
	 */
	created() {
		this.map2DLat = this.lat;
		this.map2DLon = this.lon;
		this.map3DLat = this.lat;
		this.map3DLon = this.lon;
	},

	/**
	 * Computed properties.
	 */
	computed: {
		/**
		 * Returns an object that associates each source to a color.
		 * @returns {Object.<string, string>}
		 */
		sourceToColor() {
			// available colors
			let colors = [
				"#00BB00", // GREEN
				"#3399FF", // BLUE
				"#FF4444", // RED
				"#AAAAAA", // GREY
				"#DDDD11", // YELLOW
				"#AA33DD", // VIOLET
				"#474747", // BLACK
				"#DD8800", // ORANGE
			];

			let numColors = 0;
			let sourceToColor = {};
			this.peaks.forEach(peak => {
				if (sourceToColor[peak.source_id] === undefined) {
					sourceToColor[peak.source_id] = colors[numColors++];
					if (numColors >= colors.length) {
						console.error('More sources than available colors!');
						numColors = 0;
					}
				}
			});
			return sourceToColor;
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Switch the view mode from 2D to 3D and vice versa.
		 */
		switchViewMode() {
			switch (this.viewMode) {
			case '2D':
				this.viewMode = '3D';
				this.map3DLat = this.lat;
				this.map3DLon = this.lon;
				break;
			case '3D':
				this.viewMode = '2D';
				this.map2DLat = this.lat;
				this.map2DLon = this.lon;
				break;
			}
		},

		/**
		 * Called when the 2D map moves.
		 * @param {Object} position - [latitude, longitude]
		 */
		onMap2DMove(position) {
			if (this.viewMode === '2D') {
				this.map3DLat = position.lat;
				this.map3DLon = position.lon;
			}
		},

		/**
		 * Called when the camera moves.
		 * @param {Object} position - [latitude, longitude, heigth]
		 */
		onMap3DMove(position) {
			if (this.viewMode === '3D') {
				this.map2DLat = position.lat;
				this.map2DLon = position.lon;
			}
		},

		stopRotating() {
			this.rotate3D = false;
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
			this.map2DLat = this.lat;
			this.map3DLat = this.lat;
		},

		/**
		 * Updates the map when lon changes.
		 */
		lon() {
			this.map2DLon = this.lon;
			this.map3DLon = this.lon;
		},

		/**
		 * Updates viewMode when the mode prop changes.
		 */
		mode: {
			immediate: true,
			handler(value) {
				if (value.startsWith('2D')) {
					this.viewMode = '2D';
				} else if (value.startsWith('3D')) {
					this.viewMode = '3D';
					this.rotate3D = (value === '3D-rotate');
				}
			}
		}
	}
}

</script>

<style>
.view-mode-toggle {
	position: absolute;
	width: 8rem;
	height: 8rem;
	bottom: 1rem;
	left: 2rem;
	z-index: 503;
	cursor: pointer;
	background-size: cover;
	border-radius: 4px;
	border: 2px solid white;
	box-shadow: 0 0 1rem rgba(0,0,0,.3);
}
.legend {
	background-color: #fff;
	line-height: 1.5rem;
	position: absolute;
	padding-right: 2px;
	top: 1rem;
	right: 1rem;
	z-index: 503;
	border-radius: 4px;
	border: 2px solid white;
}
.legend i {
	left: 2px;
	top: 2px;
	margin-right: 5px;
	position: relative;
	width: 18px;
	height: 18px;
	float: left;
}
.max-size {
	width: 100%;
	height: 100%;
}
</style>
