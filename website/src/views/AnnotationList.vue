<!--
This view lists the annotations made by the user in a campaign.
-->

<template>
<div>
<side-panel-layout class="fill-screen-minus-navbar">
	<template slot="left-panel-body">
		<div>
			<b-list-group flush>
				<b-list-group-item
					class="p-0"
					v-for="peak in peaks"
					:key="peak.id"
					:active="peak === selectedPeak && selectedAnnotation === undefined"
					@click="onClickPeak(peak)"
					>
					<div class="d-flex justify-content-between align-items-center p-2">
						<div>
							<template v-if="getPeakAnnotations(peak.id).length">
								<font-awesome-icon icon="chevron-right" v-if="!toggledPeakLists.includes(peak)"></font-awesome-icon>
								<font-awesome-icon icon="chevron-down" v-if="toggledPeakLists.includes(peak)"></font-awesome-icon>
							</template>
							{{peak.name || `${locale.anonymous} ${peak.id}`}}
						</div>
						<div>
							<!-- num of annotation marking the peak as valid -->
							<b-badge variant="success" class="mr-1" pill>
								{{getPeakAnnotations(peak.id).filter(x => x.valid).length}}
							</b-badge>
							<!-- num of annotation marking the peak as invalid -->
							<b-badge variant="danger" pill>
								{{getPeakAnnotations(peak.id).filter(x => !x.valid).length}}
							</b-badge>
						</div>
					</div>
					<b-list-group style="color:#212529" v-if="toggledPeakLists.includes(peak)">
						<b-list-group-item
							style="padding: 0.5rem 2.5rem; border-top: 1px solid rgba(0, 0, 0, 0.125)"
							v-for="annotation in getPeakAnnotations(peak.id)"
							:key="annotation.id"
							:active="annotation === selectedAnnotation"
							@click.stop="onClickAnnotation(peak, annotation)"
							>
							{{locale.annotation}} {{annotation.id}}
						</b-list-group-item>
					</b-list-group>
				</b-list-group-item>
			</b-list-group>
		</div>
	</template>
	
	<template slot="body">
		<composite-map
			:legend="true"
			:lat="lat"
			:lon="lon"
			:peaks="visiblePeaks"
			:geoJson="similarPeakLink"
			@click="onClickMarker($event)">>
		</composite-map>
	</template>
</side-panel-layout>

<!-- Modal to show the details of a peak -->
<peak-details-modal ref="peakDetailsModal" v-bind="selectedPeakMarker"></peak-details-modal>

</div>
</template>

<script>
import api from '@/assets/api';
import locale from '@/assets/localization';
import CompositeMap from '@/components/CompositeMap.vue';
import PeakDetailsModal from '@/components/PeakDetailsModal.vue';
import SidePanelLayout from '@/components/SidePanelLayout.vue';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Locally registered components.
	 */
	components: {
		CompositeMap,
		PeakDetailsModal,
		SidePanelLayout
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			api,
			locale,

			campaign: undefined, // campaign properties
			annotations: undefined, // campaign annotations
			peaks: [], // peaks of the campaign
			referencePeaks: [], // reference peaks to augment the user context

			selectedPeak: undefined, // peak selected in the list
			selectedPeakMarker: undefined, // peak marker selected in the map
			toggledPeakLists: [], // peaks with open sub-list
			selectedAnnotation: undefined
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		/**
		 * Latitude of the map.
		 */
		lat() {
			if (this.selectedPeak) {
				return this.selectedPeak.lat;
			}
			return 45.976589;
		},

		/**
		 * Latitude of the map.
		 */
		lon() {
			if (this.selectedPeak) {
				return this.selectedPeak.lon;
			}
			return 7.6496971;
		},

		/**
		 * Returns the peaks visible in the map.
		 */
		visiblePeaks() {
			let array = [];
			if (this.selectedPeak) {
				array.push(this.selectedPeak);
			}
			if (this.similarPeak) {
				array.push(this.similarPeak);
			}
			return array;
		},

		/**
		 * Returns the similar peak if available in the annotation.
		 */
		similarPeak() {
			if (this.selectedAnnotation) {
				let similarElementId = this.selectedAnnotation.similar_element_id;
				if (similarElementId) {
					let similarPeak = this.referencePeaks.filter(x => x.id === similarElementId);
					if (similarPeak.length) {
						return similarPeak[0];
					}
				}
			}
			return undefined;
		},

		/**
		 * Returns the GeoJson of the link of similar peaks.
		 */
		similarPeakLink() {
			let geojson =  {
				type: "FeatureCollection",
				features: []
			}
			if (this.similarPeak) {
				geojson.features.push(Utils.createLineFeature(
					this.selectedPeak.lat, this.selectedPeak.lon,
					this.similarPeak.lat, this.similarPeak.lon
				));
			}
			return geojson;
		}
	},

	/**
	 * Called after the component instance has been created.
	 */
	created() {
		// check if the user has logged in
		if (!api.loggedIn) return;

		let campaignId = this.$route.query.campaign_id;
		let peakId = this.$route.query.peak_id;
		if (!campaignId) {
			this.$router.push('/campaigns');
			return;
		}
		// load the campaign
		api.campaigns.get(campaignId)
		.then(campaign => {
			this.campaign = campaign;
			this.peaks = campaign.peaks;
			this.referencePeaks = campaign.ref_peaks;

			// set the marker color for the reference peaks
			/*this.referencePeaks.forEach(peak => {
				peak.markerColorId = 3; // gray
			});*/
			// set the marker color for the remaining peaks
			//this.updatePeaksMarkerColor();

			// load the annotations
			return api.annotations.list(campaignId);
		})
		.then(annotations => {
			this.annotations = annotations;
			// sort peaks by annotations count
			this.peaks.sort((a, b) => {
				let countA = this.getPeakAnnotations(a.id).length;
				let countB = this.getPeakAnnotations(b.id).length;
				return countB - countA;
			});
		})
		.catch(err => {
			Utils.Error('Could not load the campaign', err);
		});
	},

	/**
	 * Methods for the Vue instance.
	 */
	methods: {

		/**
		 * Called when a peak in the list is clicked.
		 */
		onClickPeak(peak) {
			this.selectedPeak = peak;
			this.selectedAnnotation = undefined;

			// toggle annotation list
			let index = this.toggledPeakLists.indexOf(peak);
			if (index >= 0) {
				this.toggledPeakLists.splice(index, 1);
			} else {
				this.toggledPeakLists.push(peak);
			}
		},

		/**
		 * Called when annotation in the list is clicked.
		 */
		onClickAnnotation(peak, annotation) {
			this.selectedPeak = peak;
			this.selectedAnnotation = annotation;
		},

		/**
		 * Shows the details of the clicked peak.
		 */
		onClickMarker(peak) {
			this.selectedPeakMarker = peak;
			let peakDetailsModal = this.$refs.peakDetailsModal;
			peakDetailsModal.show();
		},

		/**
		 * Returns the annotations for the given peak
		 * 
		 * @param {string} peakId
		 */
		getPeakAnnotations(peakId) {
			if (this.annotations && this.annotations[peakId]) {
				return this.annotations[peakId];
			}
			return [];
		}
	}
}
</script>