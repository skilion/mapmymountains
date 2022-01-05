<!--
This view allows the user to search for peaks.
-->

<template>
<div>
	<side-panel-layout class="fill-screen-minus-navbar" :showPanel="showSidePanel">
		<template slot="left-panel-body">
			<b-container>

				<!-- Search controls -->
				<b-row class="my-3" style="postion:absolute">
					<b-col>
						<b-form @submit.prevent="search" inline>
							<b-input type="text" class="mr-3 flex-grow-1" v-model="query"></b-input>
							<b-button type="submit">
								<font-awesome-icon icon="spinner" spin v-if="showSpinner"></font-awesome-icon>
								{{locale.search}}
							</b-button>
						</b-form>
					</b-col>
				</b-row>

				<b-row v-if="peaks.length == 0">
					<b-col>
						<p>{{locale.no_results}}.</p>
					</b-col>
				</b-row>
			
			</b-container>
			
			<!-- Search results -->
			<b-list-group v-if="peaks.length > 0" flush>
				<b-list-group-item v-for="peak in peaks"
					:key="peak.id"
					@click="onListPeakClick(peak)"
					:class="{ 'active': selectedPeak && selectedPeak.id === peak.id }">
					{{peak.name ? peak.name : `${locale.anonymous} ${peak.id}`}}
				</b-list-group-item>
			</b-list-group>

		</template>

		<template slot="body">
			<CompositeMap id="explore-composite-map"
				ref="map"
				:lat="lat"
				:lon="lon"
				:peaks="peaks"
				:selectedPeak="selectedPeak"
				:legend="true"
				:mode="mapViewMode"
				@click="onMapPeakClick">
			</CompositeMap>
		</template>
	</side-panel-layout>

	<!-- Modal to show the details of a peak -->
	<peak-details-modal ref="peakDetailsModal" v-bind="selectedPeak"></peak-details-modal>
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
			query: '',
			showSpinner: false,
			peaks: [],
			selectedPeak: null,
			showSidePanel: true,
			mapViewMode: '3D'
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		lat() {
			if (this.selectedPeak) return this.selectedPeak.lat;
			return 45.8012;
		},

		lon() {
			if (this.selectedPeak) return this.selectedPeak.lon;
			return 9.0928;
		}
	},

	/**
	 * Called after the component instance has been created.
	 */
	created() {
		let query = this.$route.query.q;
		if (query !== undefined) {
			this.showSidePanel = false;
			this.mapViewMode = '3D-rotate';
			this.query = query;
			this.search();
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Perform a peak search by query.
		 */
		search() {
			this.showSpinner = true;
			api.search.get(this.query)
			.then(peaks => {
				this.selectedPeak = peaks.length ? peaks[0] : null;
				this.peaks = peaks;
			})
			.catch(err => {
				Utils.Error('Could perform the search', err);
			})
			.finally(() => {
				this.showSpinner = false;
			})
		},

		/**
		 * Called when the user click on a peak in the result list.
		 * @param {Object} peak
		 */
		onListPeakClick(peak) {
			if (this.selectedPeak === peak) {
				this.onMapPeakClick(peak);
			}
			this.selectedPeak = peak;
		},

		/**
		 * Called when the user click on a peak in the map.
		 * @param {Object} peak
		 */
		onMapPeakClick(peak) {
			this.selectedPeak = peak;
			// show modal
			let peakDetailsModal = this.$refs.peakDetailsModal;
			peakDetailsModal.show();
		}
	}
}

</script>

<style>
.nopadding {
	padding-left: 0px !important;
	padding-right: 0px !important;
}
.cesium-widget-credits {
	float: right;
}
#close-button {
	color: rgb(108, 117, 125);
}
#close-button:hover {
	color: rgb(84, 91, 98);
}
#search-side-panel {
	width: 28rem;
	height: calc(100vh - 3.5rem);
}
#side-panel-shadow {
	position: absolute;
	width: 2rem;
	height: 100%;
	top: 0;
	left: 0;
	background: linear-gradient(to right, rgb(50,50,
	50) 0%,rgba(50,50,50,0) 50%);
	z-index: 500;
}
#explore-composite-map {
	width: 100%;
	height: calc(100vh - 3.5rem);
}
</style>
