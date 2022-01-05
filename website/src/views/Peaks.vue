<!--
This view shows the peaks contained in a source.
-->

<template>
<side-panel-layout class="fill-screen-minus-navbar">
	<template slot="left-panel-body">
		<b-container>

			<!-- show the source info -->
			<b-row class="my-3">
				<b-col>
					<b-card :header="locale.source_info">
						<div>Source ID: {{sourceId}}</div>
						<div v-if="sourceType=='dem_extracted'">Ground truth ID: {{groundTruthId}}</div>
						<div :class="{'text-danger':peaks.length>5000}">{{locale.num_of_peaks}}: {{peaks.length}}</div>
					</b-card>
				</b-col>
			</b-row>

			<!-- show filters for the DEM extracted peaks -->
			<b-row class="mb-3" v-if="sourceType=='dem_extracted'">
				<b-col>
					<b-card :header="locale.filters">
						<b-form-checkbox-group stacked v-model="selectedFilters">
							<b-form-checkbox value="tp">
								<div class="legend-box" style="background:#00BB00"></div>
								True positives ({{truePositivePeaks.length}})
							</b-form-checkbox>
							<b-form-checkbox value="fp">
								<div class="legend-box" style="background:#FF4444"></div>
								False positives ({{falsePositivePeaks.length}})
							</b-form-checkbox>
							<b-form-checkbox value="tpgt">
								<div class="legend-box" style="background:#3399FF"></div>
								Ground truth, w/true positives ({{truePositiveGroundTruthPeaks.length}})
							</b-form-checkbox>
							<b-form-checkbox value="fn">
								<div class="legend-box" style="background:#AAAAAA"></div>
								Ground truth, false negatives ({{falseNegativePeaks.length}})
							</b-form-checkbox>
						</b-form-checkbox-group>
					</b-card>
				</b-col>
			</b-row>

			<!-- show the details of the selected peak -->
			<b-row class="mb-3" v-if="selectedPeak">
				<b-col>
					<peak-details v-bind="selectedPeak"></peak-details>
				</b-col>
			</b-row>
		</b-container>
	</template>
	<template slot="body">
		<CompositeMap
			:lat="lat || defaultLat"
			:lon="lon || defaultLon"
			:peaks="visiblePeaks"
			:selectedPeak="selectedPeak"
			:geoJson="extraGeometryGeoJson"
			mode="3D"
			@click="onPeakMarkerClick">
		</CompositeMap>
	</template>
</side-panel-layout>
</template>

<script>
import api from '@/assets/api';
import locale from '@/assets/localization';
import CompositeMap from '@/components/CompositeMap';
import PeakDetails from '@/components/PeakDetails.vue';
import SidePanelLayout from '@/components/SidePanelLayout';
import * as Utils from '@/components/Utils';
import { average } from '@/assets/math';

export default {
	/**
	 * Locally registered components.
	 */
	components: {
		CompositeMap,
		PeakDetails,
		SidePanelLayout
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			locale,
			sourceId: "",
			sourceType: "",
			peaks: [], // all true and false positive peaks
			selectedFilters: ["tp", "tpgt"],
			groundTruthPeaks: [],
			similarPeaksLinks: {},
			selectedPeak: undefined, // peak selected by click
			groundTruthId: "",
			extraGeometryGeoJson: null, // GeoJson for the area groups and peak links
			lat: undefined,
			lon: undefined
		}
	},

	/**
	 * Called after the component instance is created.
	 */
	created() {
		// check if the user has logged in
		if (!api.loggedIn) return;
		
		const sourceId = this.sourceId = this.$route.query.source_id;
		if (!sourceId) {
			this.$router.push('/dem_peaks_list');
			return;
		}
		api.sources.getInfo(sourceId)
		.then(info => {
			this.sourceType = info.type;
			return api.sources.getPeaks(sourceId);
		})
		.then(data => {
			this.peaks = data.peaks;
			this.groundTruthPeaks = data.ground_truth_peaks;
			this.similarPeaksLinks = data.similar_peaks_links;
			this.groundTruthId = data.ground_truth_peaks.length ? data.ground_truth_peaks[0].source_id : "";
			// force the marker colors
			this.truePositivePeaks.forEach(peak => {
				peak.markerColorId = 0;
			});
			this.falsePositivePeaks.forEach(peak => {
				peak.markerColorId = 2;
			});
			this.truePositiveGroundTruthPeaks.forEach(peak => {
				peak.markerColorId = 1;
			});
			this.falseNegativePeaks.forEach(peak => {
				peak.markerColorId = 3;
			});
		})
		.catch(err => {
			Utils.Error('Cannot retrieve the peaks of the source', err);
		});
	},

	/**
	 * Computed properties.
	 */
	computed: {
		/**
		 * Returns the true positive peaks, which are the peaks that have a correspondent one in the ground truth.
		 */
		truePositivePeaks() {
			return this.peaks.filter(peak => this.similarPeaksLinks[peak.id]);
		},

		/**
		 * Returns the false positive peaks, which are the peaks that do not
		 * have a correspondent one in the ground truth.
		 */
		falsePositivePeaks() {
			return this.peaks.filter(peak => this.similarPeaksLinks[peak.id] === undefined);
		},

		/**
		 * Returns the ground truth peaks that are connected to a true positive one.
		 */
		truePositiveGroundTruthPeaks() {
			return this.groundTruthPeaks.filter(peak => this.similarPeaksLinks[peak.id]);
		},

		/**
		 * Returns the false negative peaks, which are the ground truth peaks
		 * that do not have a correspondent one in the true positives.
		 */
		falseNegativePeaks() {
			return this.groundTruthPeaks.filter(peak => this.similarPeaksLinks[peak.id] === undefined);
		},

		/**
		 * Returns the visible peaks according to the enabled filters.
		 */
		visiblePeaks() {
			if (this.sourceType === "public") return this.peaks;
			let visiblePeaks = [];
			if (this.selectedFilters.includes("tp")) {
				visiblePeaks = visiblePeaks.concat(this.truePositivePeaks);
			}
			if (this.selectedFilters.includes("fp")) {
				visiblePeaks = visiblePeaks.concat(this.falsePositivePeaks);
			}
			if (this.selectedFilters.includes("tpgt")) {
				visiblePeaks = visiblePeaks.concat(this.truePositiveGroundTruthPeaks);
			}
			if (this.selectedFilters.includes("fn")) {
				visiblePeaks = visiblePeaks.concat(this.falseNegativePeaks);
			}
			return visiblePeaks;
		},

		/**
		 * Returns all peaks contained in the component.
		 */
		allPeaks() {
			return this.peaks.concat(this.groundTruthPeaks);
		},
		
		defaultLat() {
			if (this.allPeaks.length > 0) {
				return average(this.allPeaks.map(peak => peak.lat));
			}
			return 45.801263;
		},
		
		defaultLon() {
			if (this.allPeaks.length > 0) {
				return average(this.allPeaks.map(peak => peak.lon));
			}
			return 9.092747;
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Called when the user clicks a peak.
		 * @param {Object} peak
		 */
		onPeakMarkerClick(peak) {
			if (this.selectedPeak === peak) {
				// focus on the peak on successive clicks
				this.lat = this.selectedPeak.lat;
				this.lon = this.selectedPeak.lon;
			}
			this.selectedPeak = peak;
			this.updateExtraGeometry();
		},

		/**
		 * Updates the GeoJson for drawing the area groups and the similarity link.
		 */
		updateExtraGeometry() {
			this.extraGeometryGeoJson = null;
			if (!this.selectedPeak) return;

			let geojson =  {
				type: "FeatureCollection",
				features: []
			}

			// area group
			let areaGroupAdded = false;
			if (this.selectedPeak.area_group) {
				areaGroupAdded = true;
				geojson.features.push(createAreaGroupFeature(this.selectedPeak.area_group));
			}

			// similarity link
			if (this.selectedFilters.includes("tp") && this.selectedFilters.includes("tpgt")) { // exit if the similar peaks are not visible
				const similarPeakId = this.similarPeaksLinks[this.selectedPeak.id];
				const similarPeak = this.allPeaks.filter(peak => peak.id === similarPeakId)[0];
				if (similarPeak) {
					geojson.features.push(Utils.createLineFeature(
						this.selectedPeak.lat, this.selectedPeak.lon,
						similarPeak.lat, similarPeak.lon
					));
					if (!areaGroupAdded && similarPeak.area_group) {
						areaGroupAdded = true;
						geojson.features.push(createAreaGroupFeature(similarPeak.area_group));
					}
				}
			}

			if (geojson.features.length > 0) {
				this.extraGeometryGeoJson = geojson;
			}
		}
	}
}

/**
 * Creates the GeoJson feature representing the area group of a peak.
 * @param {Object} areaGroup
 * @returns {Object}
 */
function createAreaGroupFeature(areaGroup) {
	const geojson = {
		type: "Feature",
		geometry: {
			type: "MultiPolygon",
			coordinates: []
		}
	}
	areaGroup.forEach(box => {
		const minLon = Math.min(box[0][0], box[1][0]);
		const maxLon = Math.max(box[0][0], box[1][0]);
		const minLat = Math.min(box[0][1], box[1][1]);
		const maxLat = Math.max(box[0][1], box[1][1]);
		geojson.geometry.coordinates.push([
			[
				[minLon, minLat],
				[maxLon, minLat],
				[maxLon, maxLat],
				[minLon, maxLat],
				[minLon, minLat]
			]
		]);
	});
	return geojson;
}

</script>

<style>
.fill-screen-minus-navbar {
	height: calc(100vh - 3.5rem);
}
.legend-box {
	margin-right: 0.5rem;
	margin-top: 0.25rem;
	width: 1rem;
	height: 1rem;
	line-height: 1.12rem;
	color: white;
	float: left;
	text-align: center;
}
</style>
