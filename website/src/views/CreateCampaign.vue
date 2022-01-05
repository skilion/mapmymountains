<!--
This view allows the user to create a new crowdsourcing campaign.
-->

<template>
<b-container>
	<b-row class="my-3">
		<b-col>
			<h1>
				{{!this.campaignId ? locale.create_new_campaign : locale.edit_campaign}}
			</h1>
		</b-col>
	</b-row>
	<b-row class="mb-3">
		<b-col>
			<b-alert :show="error!=''" variant="danger">{{error}}</b-alert>
		</b-col>
	</b-row>
	<b-form @submit.prevent="createCampaign">
		<b-row class="mb-3">

			<!-- Campaing details -->
			<b-col cols="3">
				<b-container fluid>
					<b-form-row>
						<b-form-group class="col" :label="locale.name + '*:'" label-for="name">
							<b-form-input id="name" type="text" :class="{'is-invalid':nameError}" v-model="name" autofocus></b-form-input>
							<small class="text-danger">{{nameError}}</small>
						</b-form-group>
					</b-form-row>
					<b-form-row>
						<b-form-group class="col" :label="locale.description + '*:'" label-for="description">
							<b-form-textarea id="description" rows="4" :no-resize="true" :class="{'is-invalid':descriptionError}" v-model="description"></b-form-textarea>
							<small class="text-danger">{{descriptionError}}</small>
						</b-form-group>
					</b-form-row>
					<b-form-row>
						<b-form-group class="col" :label="locale.starts_on + '*:'" label-for="start_date">
							<b-form-input id="start_date" type="date" :class="{'is-invalid':startDateError}" v-model="startDate"></b-form-input>
							<small class="text-danger">{{startDateError}}</small>
						</b-form-group>
					</b-form-row>
					<b-form-row>
						<b-form-group class="col" :label="locale.ends_on + '*:'" label-for="end_date">
							<b-form-input id="end_date" type="date" :class="{'is-invalid':endDateError}" v-model="endDate"></b-form-input>
							<small class="text-danger">{{endDateError}}</small>
						</b-form-group>
					</b-form-row>
					<b-form-row>
						<b-form-group class="col" :label="locale.source + '*:'" label-for="source">
							<b-form-select id="source" :class="{'is-invalid':sourceError}" v-model="source" :options="availableSources"></b-form-select>
							<small class="text-danger">{{sourceError}}</small>
						</b-form-group>
					</b-form-row>
					<b-form-row>
						<b-form-group class="col" :label="locale.ref_source + ':'" label-for="refSource">
							<b-form-select id="refSource" v-model="refSource" :options="availableSources"></b-form-select>
						</b-form-group>
					</b-form-row>
				</b-container>
			</b-col>

			<!-- Area selection -->
			<b-col cols="9">
				<div id="map-overlay" v-if="!source">{{locale.select_source}}</div>
				<b-row>
					<div style="width:100%" :class="{ 'red-border': areaError }">
						<SelectArea class="select-area" v-model="area" :source="source" :source2="refSource"></SelectArea>
					</div>
					<small class="text-danger">{{areaError}}</small>
				</b-row>
				<b-row style="background-color: #eee" class="p-1">
					<b-form inline style="width:100%">
						<b-form-select style="min-width: 15em" v-model="selectedAreaId" :options="availableAreasNames" class="mr-2" />
						<b-button class="mr-2" @click="saveArea">{{locale.save_area}}</b-button>
						<b-button class="mr-2" @click="deleteArea">{{locale.delete_area}}</b-button>
						<b-button @click="showUploadAreaModal">{{locale.upload_area}}</b-button>
					</b-form>
				</b-row>
			</b-col>
		</b-row>

		<!-- Create campaign button -->
		<b-row>
			<b-col>
				<b-button type="submit" variant="success" style="float:right">
					<font-awesome-icon icon="spinner" spin v-if="showSpinner"></font-awesome-icon>
					{{!this.campaignId ? locale.create_campaign : locale.save}}
				</b-button>
			</b-col>
		</b-row>
	</b-form>

	<!-- Modal for uploading a GeoJSON area -->
	<b-modal ref="uploadAreaModal" :title="locale.upload_area" centered @ok="uploadArea">
		<b-form-file accept=".geojson,.json,application/json" v-model="areaFile" class="mt-3"></b-form-file>
	</b-modal>

</b-container>
</template>

<script>
import api from '@/assets/api';
import locale from '@/assets/localization';
import SelectArea from '@/components/SelectArea';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Locally registered components.
	 */
	components: {
		SelectArea
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		let now = new Date();
		let end = new Date(now.getTime() + 1000 * 60  * 60 * 24 * 31);
		now = now.toISOString().substring(0, 10);
		end = end.toISOString().substring(0, 10);
		return {
			locale,
			error: '',
			campaignId: undefined,
			availableSources: [],
			name: '',
			nameError: '',
			description: '',
			descriptionError: '',
			startDate: now,
			startDateError: '',
			endDate: end,
			endDateError: '',
			source: '',
			sourceError: '',
			refSource: '',
			area: [],
			areaError: '',
			showSpinner: false,
			availableAreas: [],
			selectedAreaId: '',
			areaFile: undefined,
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		availableAreasNames() {
			let areas = [{ value: '', text: locale.select_an_area + '...' }];
			return areas.concat(this.availableAreas.map(x => x.id));
		}
	},

	/**
	 * Called after the component instance is created.
	 */
	created() {
		// check if the user has logged in
		if (!api.loggedIn) return;

		// set the available sources to choose from
		api.sources.list()
		.then(sources => {
			sources = sources.map(source => ({ value: source.id, text: source.id }));
			sources.unshift({ value: '', text: locale.select_source + '...' })
			this.availableSources = sources;
		})
		.catch(err => {
			Utils.Error('Cannot load the peak sources', err);
		});
		
		// if we are editing a campaign load the parameters
		let campaignId = this.$route.query.campaign_id;
		if (campaignId !== undefined) {
			api.campaigns.get(campaignId)
			.then(campaign => {
				this.campaignId = campaignId;
				this.name = campaign.name;
				this.description = campaign.description;
				this.endDate = campaign.end_time.substring(0, 10);
				this.source = campaign.source_id;
				this.refSource = campaign.ref_source_id;
				this.area = campaign.boundary;
			})
			.catch(err => {
				Utils.Error('Could not load the campaign', err);
			});
		}
		
		this.updateAvailableAreas();
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Creates the campaign.
		 */
		createCampaign() {
			this.error = '';
			this.nameError = '';
			this.descriptionError = '';
			this.startDateError = '';
			this.endDateError = '';
			this.sourceError = '';
			this.areaError = '';
			if (!this.name) {
				this.nameError = locale.name_empty_error;
				return;
			}
			if (!this.description) {
				this.descriptionError = locale.description_empty_error;
				return;
			}
			if (isNaN(Date.parse(this.startDate))) {
				this.startDateError = locale.date_is_invalid;
				return;
			}
			if (isNaN(Date.parse(this.endDate))) {
				this.endDateError = locale.date_is_invalid;
				return;
			}
			let now = new Date();
			let startTime = new Date(this.startDate);
			let endTime = new Date(this.endDate);
			zeroDateOffset(now);
			zeroDateOffset(startTime);
			zeroDateOffset(endTime);
			if (startTime.getTime() < now.getTime()) {
				this.startDateError = locale.start_date_past_error;
				return;
			}
			if (endTime.getTime() <= startTime.getTime()) {
				this.endDateError = locale.start_end_date_error;
				return;
			}
			if (endTime.getTime() <= now.getTime()) {
				this.endDateError = locale.end_date_past_error;
				return;
			}
			if (!this.source) {
				this.sourceError = locale.select_source;
				return;
			}
			if (this.area.length == 0) {
				this.areaError = locale.select_an_area;
				return;
			}
			// campaign object
			let campaign = {
				name: this.name,
				description: this.description,
				start_time: startTime.toISOString(),
				end_time: endTime.toISOString(),
				boundary: this.area,
				source_id: this.source,
				ref_source_id: this.refSource || undefined
			}
			this.showSpinner = true;
			if (this.campaignId) {
				api.campaigns.update(this.campaignId, campaign)
				.then(() => {
					this.$router.push('/campaigns');
				})
				.catch(err => {
					Utils.Error('Cannot update the campaign', err);
				})
				.finally(() => {
					this.showSpinner = false;
				});
			} else {
				api.campaigns.create(campaign)
				.then(() => {
					this.$router.push('/campaigns');
				})
				.catch(err => {
					Utils.Error('Cannot create the campaign', err);
				})
				.finally(() => {
					this.showSpinner = false;
				});
			}
		},

		/**
		 * Updates the available areas from the backend.
		 */
		updateAvailableAreas() {
			// set the available areas to choose from
			api.areas.list()
			.then(areas => {
				this.availableAreas = areas;
			})
			.catch(err => {
				Utils.MessageBox(locale.error , err.toString());
			});
		},

		/**
		 * Udpates the area in the map using the selected area.
		 */
		updateArea() {
			let selectedArea = this.availableAreas.filter(area => area.id === this.selectedAreaId);
			if (selectedArea.length) {
				this.area = selectedArea[0].boundary;
			} else {
				this.area = [];
			}
		},

		/**
		 * Saves the current area.
		 */
		async saveArea() {
			if (this.area.length === 0) {
				Utils.MessageBox(locale.error, locale.no_area_drawn);
				return;
			}

			let areaId;
			if (this.selectedAreaId) {
				let res = await Utils.MessageBox(locale.alert, locale.want_to_overwrite + ` "${this.selectedAreaId}?`, { okOnly: false })
				if (res) areaId = this.selectedAreaId;
			}
			if(!areaId) {
				areaId = prompt(locale.enter_area_name);
				if (!areaId) return;
			}

			api.areas.create(areaId, this.area)
			.then(() => {
				this.updateAvailableAreas();
				this.selectedAreaId = areaId;
				this.updateArea();
				Utils.MessageBox(locale.alert, locale.area_saved);
			})
			.catch(err => {
				Utils.MessageBox(locale.error, 'Cannot save the area');
			});
		},

		/**
		 * Deletes the selected area.
		 */
		async deleteArea() {
			if (!this.selectedAreaId) {
				Utils.MessageBox(locale.alert, locale.no_area_selected);
				return;
			}
			let res = await Utils.MessageBox(locale.alert, locale.want_to_delete + ` "${this.selectedAreaId}?`, { okOnly: false })
			if (!res) return;
			api.areas.delete(this.selectedAreaId)
			.then(() => {
				this.selectedAreaId = '';
				this.updateAvailableAreas();
				this.updateArea();
			})
			.catch(err => {
				Utils.MessageBox(locale.error, 'Cannot delete the area');
			});
		},

		/**
		 * Uploads a new area.
		 */
		uploadArea() {
			if (!this.areaFile) return;
			var reader = new FileReader();
			reader.onload = (event) => {
				try {
					let json = JSON.parse(event.target.result);
					let valid = true;
					if (
						!json.type ||
						json.type !== "FeatureCollection" ||
						!json.features ||
						!json.features.length ||
						!json.features[0].type ||
						json.features[0].type !== "Feature" ||
						!json.features[0].geometry ||
						(
							json.features[0].geometry.type !== "Polygon" &&
							json.features[0].geometry.type !== "MultiPolygon"
						) ||
						!json.features[0].geometry.coordinates
					) {
						Utils.MessageBox(locale.error, 'Only GeoJSON files are with a single feature (Polygon or MultiPolygon) are supported');
						return;
					}
					if (json.features[0].geometry.type === "Polygon") {
						this.area = json.features[0].geometry.coordinates[0];
						// skip holes
					} else if (json.features[0].geometry.type === "MultiPolygon") {
						this.area = json.features[0].geometry.coordinates[0][0];
						// skip holes and additional polygons
					}
				} catch (err) {
					Utils.MessageBox(locale.error, 'Cannot read the area');
				}
			}
			reader.onerror = (err) => {
				Utils.MessageBox(locale.error, 'Error while reading the file');
			}
			reader.readAsText(this.areaFile);
		},

		showUploadAreaModal() {
			this.$refs.uploadAreaModal.show();
		}
	},

	/**
	 * Custom watchers.
	 */
	watch: {
		selectedAreaId() {
			this.updateArea();
		}
	}
}

/**
 * Zeros the hours, minutes, seconds, and milliseconds of the given date.
 * @param {Date} date
 */
function zeroDateOffset(date) {
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	date.setMilliseconds(0);
}
</script>

<style>
.red-border {
	border: 1px solid red;
}
.select-area {
	width: 100%;
	height: 40rem;
}
#map-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1001;
	background-color: rgb(128,128,128,0.8);
	color: white;
	font-size: 3rem;
	text-align: center;
	vertical-align: middle;
	line-height: 40rem; 
}
</style>
