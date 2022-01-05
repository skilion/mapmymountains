<!--
This allows to display a JSON list of peaks without uploading it into the database.
-->

<template>
<div>
	<side-panel-layout class="fill-screen-minus-navbar">
		<template slot="left-panel-body">
			<b-container>
				<b-row>
					<b-col>
						<b-card header="QuickView">
							<b-form-row>
								<b-btn @click="$refs.loadPeaksmodal.show()">Load files</b-btn>
							</b-form-row>
							<b-form-row>
								<b-form-checkbox class="mt-3" v-model="noLabels">
									Hide labels
								</b-form-checkbox>
							</b-form-row>
						</b-card>
					</b-col>
				</b-row>
				<b-row class="mt-3">
					<b-col>
						<peak-details v-bind="selectedPeak" v-if="selectedPeak"></peak-details>
					</b-col>
				</b-row>
			</b-container>
		</template>
		<template slot="body">
			<CompositeMap
				:lat="lat || defaultLat"
				:lon="lon || defaultLon"
				:peaks="peaks"
				:selectedPeak="selectedPeak"
				:noLabels="noLabels"
				mode="3D"
				@click="onPeakMarkerClick">
			</CompositeMap>
		</template>
	</side-panel-layout>

	<!-- custom modal to load peaks -->
	<b-modal ref="loadPeaksmodal" title="Load peaks" centered>
		<b-container fluid>
			<b-form-row>
				<b-col>
					<b-form-group label="Peaks files:">
						<b-form-file accept=".json" v-model="peakFiles" multiple></b-form-file>
					</b-form-group>
				</b-col>
			</b-form-row>
		</b-container>
		<template slot="modal-footer">
			<b-button variant="primary" @click="loadPeaks">
				{{locale.upload}}
			</b-button>
		</template>
	</b-modal>
</div>
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
			peaks: [], // all true and false positive peaks
			selectedPeak: undefined, // peak selected by click
			lat: undefined,
			lon: undefined,
			peakFiles: [],
			noLabels: true
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		defaultLat() {
			if (this.peaks.length > 0) {
				return average(this.peaks.map(peak => peak.lat));
			}
			return 45.801263;
		},
		
		defaultLon() {
			if (this.peaks.length > 0) {
				return average(this.peaks.map(peak => peak.lon));
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
		},

		/**
		 * Load the peak files.
		 */
		loadPeaks() {
			this.peaks = [];
			let peakCount = 1;
			for (let i = 0; i < this.peakFiles.length; i++) {
				let name = this.peakFiles[i].name;
				let reader = new FileReader();
				reader.onload = (event) => {
					try {
						let json = JSON.parse(event.target.result);
						json.forEach(peak => {
							peakCount++;
							peak.source_id = name;
							peak.custom_id = peak.id ? peak.id.toString() : undefined;
							peak.id = -peakCount;
							// extract lat and lon
							if(!peak.lat || !peak.lon) {
								peak.lat = 0;
								peak.lat = 0;
								if (peak.realCoord) {
									peak.lat = peak.realCoord.lat;
									peak.lon = peak.realCoord.lon;
								}
								if (peak.estimatedCoord) {
									peak.lat = peak.estimatedCoord.lat;
									peak.lon = peak.estimatedCoord.lon;
								}
							}
						});
						this.peaks = this.peaks.concat(json);
					} catch (err) {
						Utils.Error('Cannot read the area', err);
					}
				}
				reader.onerror = (err) => {
					Utils.Error('Error while reading the file', err);
				}
				reader.readAsText(this.peakFiles[i]);
			}
			this.$refs.loadPeaksmodal.hide();
		}
	}
}
</script>

<style>
.fill-screen-minus-navbar {
	height: calc(100vh - 3.5rem);
}
</style>
