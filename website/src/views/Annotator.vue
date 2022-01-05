<!--
This view handles the annotation process for a campaign
-->

<template>
<div>
<side-panel-layout style="height: 100vh">
	<template slot="left-panel-body">
		<b-container>
			<!-- Campaign title -->
			<b-row class="mt-3">
				<b-col>
					<router-link id="close-button" class="float-left mr-3" to="/campaigns">
						<font-awesome-icon icon="arrow-left" size="2x">
						</font-awesome-icon>
					</router-link>
					<h3>{{campaign ? campaign.name : localization.loading}}</h3>
				</b-col>
			</b-row>

			<!-- List of peaks to annotate -->
			<b-row class="mt-3">
				<b-col :class="{ 'tutorial-focus': tutorialStep == 3 }">
					<b-card style="width:100%" class="mt-3" no-body>
						<b-tabs card v-model="peakListTabIndex">
							<b-tab :title="localization.peaks_to_annotate" active no-body>
								<b-list-group class="peak-list" flush>
									<b-list-group-item
										v-for="peak in peaksToAnnotate"
										:key="peak.id"
										@click="setSelectedPeak(peak)"
										:class="{ active: selectedPeak && selectedPeak.id === peak.id }">
										{{peak.name || `${localization.anonymous} ${peak.id}`}}
									</b-list-group-item>
								</b-list-group>
							</b-tab>
							<b-tab :title="localization.annotated_peaks" no-body>
								<p class="card-text peak-list p-3" v-if="peaksAnnotated.length==0">{{localization.no_annotated_peaks}}</p>
								<b-list-group class="peak-list" flush v-if="peaksAnnotated.length>0">
									<b-list-group-item
										v-for="peak in peaksAnnotated"
										:key="peak.id"
										@click="setSelectedPeak(peak)"
										:class="{ active: selectedPeak && selectedPeak.id === peak.id }">
										{{peak.annotation.name || peak.name || `${localization.anonymous} ${peak.id}`}}
									</b-list-group-item>
								</b-list-group>
							</b-tab>
						</b-tabs>
					</b-card>
				</b-col>
			</b-row>

			<!-- Buttons to navigate peaks -->
			<b-row class="m-1">
				<b-button class="col mr-1" @click="setSelectedPeak(prevPeak)" :disabled="!prevPeak">
					<font-awesome-icon icon="arrow-left"></font-awesome-icon> {{localization.previous}}
				</b-button>
				<b-button class="col ml-1" @click="setSelectedPeak(nextPeak)" :disabled="!nextPeak">
					{{localization.next}} <font-awesome-icon icon="arrow-right"></font-awesome-icon>
				</b-button>
			</b-row>
			
			<!-- Selected peak info -->
			<b-row class="mt-3">
				<b-col :class="{ 'tutorial-focus': tutorialStep == 4 }">
					<PeakDetails class="mt-3" v-if="selectedPeak!=null" v-bind="selectedPeak">
						<!-- Annotation form -->
						<b-form @submit.prevent="saveAnnotation" class="mt-2" v-if="selectedPeak && selectedPeak.annotation!==undefined">
							<b-form-group>
								<label for="peak-valid"><b>{{localization.is_peak}}</b></label><br>
								<!-- Button to mark peak as invalid -->
								<b-button
									class="mr-3"
									:variant="isPeakValid===false ? 'danger' : 'outline-danger'"
									@click="markPeakInvalid">
										{{localization.no}}
								</b-button>
								<!-- Button to mark peak as valid -->
								<b-button
									class="mr-3"
									:variant="isPeakValid===true && !(selectingReferencePeak || similarPeak) ? 'success' : 'outline-success'"
									@click="markPeakValid">
										{{localization.yes}}
								</b-button>
								<!-- Button to select similar peaks -->
								<b-button
									v-if="referencePeaks.length>0"
									:variant="isPeakValid===true && (selectingReferencePeak || similarPeak) ? 'success' : 'outline-success'"
									@click="markPeakSimilar">
										{{localization.peak_exists}}
									</b-button>
							</b-form-group>

							<!-- Annotation details -->
							<b-collapse id="annotation-details" :visible="isPeakValid">
								<div>
									<label for="peak-name"><b>{{localization.whats_its_name}}</b></label>
									<b-form-input id="peak-name" type="text" :placeholder="localization.peak_name" v-model="peakName"></b-form-input>
								</div>
								
								<b-button class="pl-2" v-if="!showExtraFields" variant="link" @click="showExtraFields=true">{{localization.more}}...</b-button>

								<!-- Annotation extra fields -->
								<b-collapse id="annotation-details-more" v-model="showExtraFields">
									<!-- Alternative names -->
									<div>
										<div v-for="i in alternateNames">
											<b-form-input class="mt-1" type="text" :placeholder="localization.other_peak_name" v-model="i.alternate_name">
											</b-form-input>
										</div>
										<b-button style="display:block" class="ml-auto mt-1" size="sm" @click="alternateNames.push({alternate_name:''})">+</b-button>
									</div>
									<b-form-group>
										<label for="peak-ele"><b>{{localization.whats_its_elevation}}</b></label>
										<b-form-input id="peak-ele" type="number" :placeholder="localization.elevation" v-model="peakEle"></b-form-input>
									</b-form-group>
								</b-collapse>
							</b-collapse>

							<div class="mt-4">
								<!-- Save annotation button -->
								<b-button type="submit" class="mr-3" variant="primary" :disabled="isPeakValid===undefined">
									<font-awesome-icon icon="spinner" spin v-if="savingAnnotation"></font-awesome-icon>
									{{localization.save}}
								</b-button>

								<!-- Cancel annotation button -->
								<b-button :disabled="isPeakValid===undefined" @click="clearAnnotation">
									{{localization.cancel}}
								</b-button>
							</div>
						</b-form>
					</PeakDetails>
				</b-col>
			</b-row>
		</b-container>

		<!-- Overlay for tutorial -->
		<div class="tutorial-overlay" v-if="tutorialStep > 1"></div>

	</template>
	<template slot="body">
		<composite-map
			ref="map"
			:mode="tutorialStep > 0 ? '3D' : '3D-rotate'"
			:lat="lat"
			:lon="lon"
			:peaks="visiblePeaks"
			:selectedPeak="selectedPeak"
			:geoJson="similarPeaksLinks"
			@click="clickPeak($event)">
		</composite-map>

		<!-- Help button -->
		<div id="help-button-widget" class="widget-border" v-b-tooltip.hover.left :title="localization.help">
			<font-awesome-icon id="help-button" class="widget big-button-widget" icon="question">
			</font-awesome-icon>
		</div>
		<b-popover style="max-width: 100%" target="help-button" placement="bottom" triggers="click blur">
			<div>
				<div class="annotator-legend-item" style="background: #DD8800"></div>
				{{localization.peaks_to_annotate}}
			</div>
			<div>
				<div class="annotator-legend-item" style="background: #00BB00"></div>
				{{localization.peaks_marked_valid}}
			</div>
			<div>
				<div class="annotator-legend-item" style="background: #FF4444"></div>
				{{localization.peaks_marked_invalid}}
			</div>
			<div>
				<div class="annotator-legend-item" style="background: #AAAAAA"></div>
				{{localization.reference_peaks}}
			</div>
			<b-button style="font-size: 0.875rem" variant="link" @click="tutorialStep = 1">{{localization.tutorial}}...</b-button>
		</b-popover>

		<!-- Feedback button -->
		<div id="feedback-button-widget" class="widget-border" v-b-tooltip.hover.left :title="localization.feedback">
			<font-awesome-icon id="feedback-button" class="widget big-button-widget" icon="smile">
			</font-awesome-icon>
		</div>
		<b-popover target="feedback-button" placement="bottom" triggers="click blur">
			<template slot="title">{{localization.feedback}}</template>
			<b-form @submit.prevent="sendFeedback">
				<b-form-group :label="localization.how_was_experience">
					<b-form-radio-group v-model="feedbackFeeling" buttons button-variant="outline-secondary">
						<b-form-radio value="happy">
							<font-awesome-icon icon="smile">
							</font-awesome-icon>
						</b-form-radio>
						<b-form-radio value="sad">
							<font-awesome-icon icon="frown">
							</font-awesome-icon>
						</b-form-radio>
					</b-form-radio-group>
				</b-form-group>
				<b-form-group :label="localization.tell_us_why">
					<b-form-textarea
						v-model="feedbackText"
						placeholder="..."
						rows="3">
					</b-form-textarea>
				</b-form-group>
				<b-form-group>
					<b-button type="submit" variant="primary">
						{{localization.send}}
					</b-button>
				</b-form-group>
			</b-form>
		</b-popover>

		<!-- User button -->
		<div id="user-button-widget" class="widget-border" v-b-tooltip.hover.left :title="localization.user">
			<font-awesome-icon id="user-button" class="widget big-button-widget" icon="user">
			</font-awesome-icon>
		</div>
		<b-popover target="user-button" placement="bottom" triggers="click blur">
			<template slot="title">{{api.userId}}</template>
			<b-button class="mr-2" to="/user">{{localization.settings}}</b-button>
			<b-button v-on:click="logout">{{localization.logout}}</b-button>
		</b-popover>

		<!-- Overlay for tutorial -->
		<div class="tutorial-overlay" v-if="tutorialStep > 2"></div>

		<!-- Modal for tutorial intro-->
		<b-modal
			:title="localization.welcome_mmm"
			:visible="tutorialStep == 1"
			ok-only
			centered
			no-close-on-backdrop
			no-close-on-esc
			@hide="tutorialStep = 2">
			{{localization.what_is_mmm}}
		</b-modal>

		<!-- Messages for tutorial -->
		<b-card
			class="tutorial-card"
			:title="localization.map + ' (1/3)'"
			style="top: 10%"
			v-if="tutorialStep == 2">
			<p>{{localization.what_is_map}}</p>
			<b-button @click="tutorialStep = 3" variant="primary">{{localization.next}}</b-button>
		</b-card>
		<b-card
			class="tutorial-card"
			:title="localization.peak_list + ' (2/3)'"
			style="top: 20%"
			v-if="tutorialStep == 3">
			<p>{{localization.what_is_peak_list}}</p>
			<b-button @click="tutorialStep = 4" variant="primary">{{localization.next}}</b-button>
        </b-card>
		<b-card
			class="tutorial-card"
			:title="localization.annotations + ' (3/3)'"
			style="top: 30%"
			v-if="tutorialStep == 4">
			<p>{{localization.what_is_annotation}}</p>
			<b-button @click="tutorialCompleted" variant="primary">{{localization.close}}</b-button>
        </b-card>

	</template>
</side-panel-layout>

<!-- Overlay for tutorial -->
<div class="tutorial-overlay" v-if="0"></div>


</div>
</template>

<script>
import api from '@/assets/api';
import localization from '@/assets/localization';
import CompositeMap from '@/components/CompositeMap.vue';
import PeakDetails from '@/components/PeakDetails.vue';
import SidePanelLayout from '@/components/SidePanelLayout.vue';
import * as Utils from '@/components/Utils';

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
			api,
			localization,

			campaign: undefined, // campaign properties
			peaks: [], // peaks of the campaign
			referencePeaks: [], // reference peaks to augment the user context

			// use these to focus the map in a specific location
			lat: 45.976589,
			lon: 7.6496971,

			// currently selected peak
			selectedPeak: undefined,

			// currently open peak list tab
			peakListTabIndex: 0, // 0 = peak to annotate, 1 = annotated peaks

			// current annotation
			isPeakValid: undefined,
			similarPeak: undefined,
			peakName: '',
			showExtraFields: false,
			alternateNames: [], // {isolanguage, alternate_name}
			peakEle: 0,
			savingAnnotation: false,
			
			// UI switches
			enableSaveButton: false,
			selectingReferencePeak: false,
			tutorialStep: 0,

			// feedback
			feedbackFeeling: 'happy',
			feedbackText: ''
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		/**
		 * Returns the peak without an annotation.
		 */
		peaksToAnnotate() {
			return this.peaks.filter(peak => !peak.annotation);
		},

		/**
		 * Returns the peak that have an annotation.
		 */
		peaksAnnotated() {
			return this.peaks.filter(peak => peak.annotation);
		},

		/**
		 * Returns all the peaks to to show on the map.
		 */
		visiblePeaks() {
			let peaks;
			if (this.selectingReferencePeak) {
				/** @type {number[]} */
				let alreadyLinkedReferencePeaksIds = this.peaksAnnotated
					.filter(x => x.annotation.similar_element_id)
					.map(x => x.annotation.similar_element_id);
				/** @type {Peak[]} */
				let availabeReferencePeaks = this.referencePeaks.filter(
					x => !alreadyLinkedReferencePeaksIds.includes(x.id)
				);
				peaks = [this.selectedPeak].concat(availabeReferencePeaks);
			} else {
				peaks = this.peaks.concat(this.referencePeaks);
			}
			return peaks;
		},

		/**
		 * Returns the next peak according to the tab opened in the peak list.
		 */
		nextPeak() {
			let peaks = this.peakListTabIndex === 0 ? this.peaksToAnnotate : this.peaksAnnotated;
			let index = peaks.indexOf(this.selectedPeak);
			if (index >= 0) {
				if (index === peaks.length - 1) return null;
				return peaks[index + 1];
			}
			return peaks ? peaks[0] : null;
		},

		/**
		 * Returns the previous peak according to the tab opened in the peak list.
		 */
		prevPeak() {
			let peaks = this.peakListTabIndex === 0 ? this.peaksToAnnotate : this.peaksAnnotated;
			let index = peaks.indexOf(this.selectedPeak);
			if (index > 0) {
				return peaks[index - 1];
			}
			return null;
		},

		/**
		 * Computes the geometry representing the links between similar peaks.
		 */
		similarPeaksLinks() {
			let geojson =  {
				type: "FeatureCollection",
				features: []
			}

			if (this.selectingReferencePeak) {
				// show only the link of the current peak
				if (this.selectedPeak && this.similarPeak) {
					geojson.features.push(Utils.createLineFeature(
						this.selectedPeak.lat, this.selectedPeak.lon,
						this.similarPeak.lat, this.similarPeak.lon
					));
				}
			} else {
				// show all links
				this.peaksAnnotated.forEach(peak => {
					const similarElementId = peak.annotation.similar_element_id;
					if (similarElementId) {
						const similarPeak = this.referencePeaks.filter(x => x.id === similarElementId);
						if (similarPeak.length == 0) {
							console.error(`Missing similar peak for annotation ${peak.annotation.id} referencing ${similarElementId}`);
							return;
						}
						geojson.features.push(Utils.createLineFeature(
							peak.lat, peak.lon,
							similarPeak[0].lat, similarPeak[0].lon
						));
					}
				});
			}

			if (geojson.features.length === 0) {
				return null;
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

		let campaignId = this.$route.query.campaign;
		let peakId = this.$route.query.peak_id;
		if (!campaignId) {
			this.$router.push('/campaigns');
			return;
		}
		// load the campaign
		api.campaigns.get(campaignId)
		.then(campaign => {
			// create the 'annotation' field so that Vue can track it when it changes
			campaign.peaks.forEach(peak => {
				if (!peak.annotation) peak.annotation = null;
			})

			this.campaign = campaign;
			this.peaks = shuffle(campaign.peaks);
			this.referencePeaks = campaign.ref_peaks;

			// set the marker color for the reference peaks
			this.referencePeaks.forEach(peak => {
				peak.markerColorId = 3; // gray
			});
			// set the marker color for the remaining peaks
			this.updatePeaksMarkerColor();

			// set first peak
			let peak = this.peaks.filter(x => x.id == peakId)[0];
			this.setSelectedPeak(peak || this.nextPeak);
		})
		.then(() => {
			return api.users.get(api.userId);
		})
		.then(user => {
			// check if the tutorial should be launched
			if (!user.view_tutorial) {
				this.tutorialStep = 1;
			}
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
		 * Performs the logout of the current user.
		 */
		logout() {
			api.logout();
			this.$router.push('/login');
		},

		setSelectedPeak(peak) {
			// null peak
			if (!peak) return;
			// do not re-select the same peak
			if (this.selectedPeak && peak.id == this.selectedPeak.id) return;
			// do not select reference peaks
			if (this.referencePeaks.includes(peak)) return;

			// reflect selected peak in the URL
			this.$router.replace({ query: {
				campaign: this.campaign.id,
				peak_id: peak.id
				}
			});
			
			this.selectedPeak = peak;
			
			this.clearAnnotation();

			// check if the peak is already annotated
			if (peak.annotation) { 
				this.isPeakValid = peak.annotation.valid;
				this.peakName = peak.annotation.name;
				// extra fields
				this.alternateNames = peak.annotation.alternate_names || [];
				this.peakEle = peak.annotation.elevation;
				if (this.alternateNames.length || this.peakEle) {
					this.showExtraFields = true;
				}
				// similar peak
				const similarElementId = peak.annotation.similar_element_id;
				if (similarElementId) {
					this.similarPeak = this.referencePeaks.filter(x => x.id === similarElementId)[0];
				}
			}
		},

		/**
		 * Called when the user clicks a peak marker.
		 */
		clickPeak(peak) {
			if (!peak) return;

			// check if we are selecting the similar peak
			if (this.selectingReferencePeak) {
				if (peak === this.selectedPeak) return;
				this.similarPeak = peak;
				this.peakName = peak.name;
				if (peak.elevation) {
					this.showExtraFields = true;
					this.peakEle = peak.elevation
				} else {
					this.showExtraFields = false;
					this.peakEle = 0;
				}
			} else {
				this.setSelectedPeak(peak);
			}
		},

		/**
		 * Saves the annotation of the current peak and selects the next peak to annotate.
		 */
		saveAnnotation() {
			// avoid to send multiple annotations for the same peak
			if (this.savingAnnotation) return;

			// build basic annotation
			let annotation = {
				'campaign_id': this.campaign.id,
				'source_element_id': this.selectedPeak.id,
				'source_element_version': this.selectedPeak.version,
				'valid': false
			}

			// additional details of the annotation
			if (this.isPeakValid) {
				annotation.valid = true;
				// official name
				if (this.peakName) {
					annotation.name = this.peakName;
				}
				// elevation
				if (this.peakEle > 600 && this.peakEle < 9000) {
					annotation.elevation = this.peakEle;
				}
				// keep not-empty alternate names
				annotation.alternate_names = this.alternateNames.filter(x => x.alternate_name);
				// similar peak
				if (this.similarPeak) {
					annotation.similar_element_id = this.similarPeak.id;
					annotation.similar_element_version = this.similarPeak.version;
				}
			}

			// keep reference to the selected peak
			let peak = this.selectedPeak;

			// go to next peak
			this.selectingReferencePeak = false;
			this.setSelectedPeak(this.nextPeak || this.prevPeak);

			// submit the annotation
			api.annotations.create(annotation)
			.then(annotation => {
				peak.annotation = annotation;
				this.updatePeaksMarkerColor();
				this.$toasted.show(localization.annotation_saved, { position: 'bottom-left', duration: 2000, type: 'success' });
			}).catch(err => {
				Utils.Error('Could not save the annotation', err);
			})
			.finally(() => {
				this.savingAnnotation = false;
			})
		},

		/**
		 * Clear the content of the current annotation.
		 */
		clearAnnotation() {
			this.isPeakValid = undefined;
			this.peakName = undefined;
			this.showExtraFields = false;
			this.alternateNames = [];
			this.peakEle = undefined;
			this.similarPeak = undefined;
			this.selectingReferencePeak = false;
		},

		/**
		 * Mark the current peak as invalid.
		 */
		markPeakInvalid() {
			this.isPeakValid = false;
			this.selectingReferencePeak = false;
		},

		/**
		 * Mark the current peak as valid.
		 */
		markPeakValid() {
			this.isPeakValid = true;
			this.selectingReferencePeak = false;
		},

		/**
		 * Enable the user to select a peak from the reference source.
		 */
		markPeakSimilar() {
			this.isPeakValid = true;
			this.selectingReferencePeak = true;
			this.$refs.map.stopRotating();
			Utils.MessageBox(localization.select_peak, localization.select_similar_peak);
		},

		/**
		 * Set the tutorial to be completed for the current user.
		 */
		tutorialCompleted() {
			this.tutorialStep = 0;
			api.users.update(api.userId, { view_tutorial: true });
		},

		/**
		 * Updates the marker color of the annotated/to annotate peaks.
		 */
		updatePeaksMarkerColor() {
			this.peaks.forEach(peak => {
				if (!peak.annotation) peak.markerColorId = 7; // orange
				else if (peak.annotation.valid) peak.markerColorId = 0; // green
				else peak.markerColorId = 2; // red
			})
		},

		/**
		 * Send the user feedback
		 */
		sendFeedback() {
			// build feedback text
			let text = `Username: ${api.userId}\n`;
			text += `Feeling: ${this.feedbackFeeling}\n\n`;
			text += this.feedbackText;

			api.feedback.send(text)
			.then(() => {
				// reset feedback fields
				this.feedbackFeeling = 'happy';
				this.feedbackText = '';
				// alert the user
				Utils.MessageBox(
					localization.alert,
					localization.feedback_sent,
					{ okOnly: true }
				);
			})
			.catch(err => {
				Utils.Error('Could not send the feedback', err);
			});
		}
	},

	/**
	 * Custom watchers.
	 */
	watch: {
		/**
		 * Focuses the map on the new selected peak.
		 */
		selectedPeak() {
			if (!this.selectedPeak) return;
			this.lat = this.selectedPeak.lat;
			this.lon = this.selectedPeak.lon;
		}
	}
}

// helper function to set the color property
function setColorBySourceId(peaks) {
	let colors = {};
	let numColor = 0;
	peaks.forEach(peak => {
		let source_id = peak.source_id;
		if (source_id in colors) {
			peak.color = colors[source_id];
		} else {
			peak.color = numColor;
			colors[source_id] = numColor;
			numColor++;
		}
	})
}

/**
 * Shuffle an array in place.
 * @param {Array} array
 * @returns {Array}
 */
function shuffle(array) {
	for (let i = 0; i < array.length - 1; i++) {
		let j = Math.floor(Math.random() * (array.length - i) + i);
		let tmp = array[i];
		array[i] = array[j];
		array[j] = tmp;
	}
	return array;
}
</script>

<style>
#close-button {
	color: rgb(108, 117, 125);
}
#close-button:hover {
	color: rgb(84, 91, 98);
}
#feedback-button-widget {
	position: absolute;
	top: 0.8rem;
	right: 3.6rem;
	z-index: 435;
}
#help-button-widget {
	position: absolute;
	top: 0.8rem;
	right: 50%;
	z-index: 430;
}
#user-button-widget {
	position: absolute;
	top: 0.8rem;
	right: 0.8rem;
	z-index: 440;
}
.annotator-legend-item {
	top: 0.1rem;
	margin-right: 0.5rem;
	position: relative;
	width: 1rem;
	height: 1rem;
	float: left;
}
.big-button-widget {
	padding: 0.5rem;
	width: 2rem !important;
	height: 2rem !important;
}
.popover{
    max-width: 500px !important;
    width: auto !important;
}
.peak-list {
	overflow-y: auto;
	height: 9rem;
}
.tutorial-card {
	position: absolute !important;
	left: 2rem;
	z-index: 601;
	width: 25rem;
	text-align: justify;
	text-justify: inter-word;
}
.tutorial-overlay {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 600;
	background-color: black;
	opacity: 0.8;
}
.tutorial-focus {
	z-index: 601;
}
.widget {
	background-color: white;
	border-radius: 2px;
	cursor: pointer;
}
.widget:hover {
	background-color: #f4f4f4;
}
.widget-border {
	border-radius: 4px;
	border: 2px solid rgba(0,0,0,.2);
	line-height: 0;
}
</style>
