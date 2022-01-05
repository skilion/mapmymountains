<!--
This component is a self contained modal for uploading a DEM extracted peak source.

Events:
- success: a peak source has been successfully uploaded.

-->

<template>
<b-modal ref="modal" :title="locale.add">
	<b-container fluid>
		<b-form-row>
			<b-col>
				<b-form-group label="Ground truth*:">
					<b-form-select v-model="groundTruth" :options="availableGroundThruths"></b-form-select>
					<small class="text-danger">{{groundTruthError}}</small>
				</b-form-group>
			</b-col>
		</b-form-row>
		<b-form-row>
			<b-col>
				<b-form-group label="True positives*:">
					<b-form-file ref="tpFile" accept=".json,application/json" v-model="tpFile" :class="{'is-invalid':tpFileError}"></b-form-file>
					<small class="text-danger">{{tpFileError}}</small>
				</b-form-group>
			</b-col>
		</b-form-row>
		<b-form-row>
			<b-col>
				<b-form-group label="False positives*:">
					<b-form-file ref="fpFile" accept=".json,application/json" v-model="fpFile" :class="{'is-invalid':fpFileError}"></b-form-file>
					<small class="text-danger">{{fpFileError}}</small>
				</b-form-group>
			</b-col>
		</b-form-row>
		<b-form-row>
			<b-col>
				<b-form-group label="Area groups:">
					<b-form-file ref="areaFiles" accept=".json" v-model="areaFiles" :class="{'is-invalid':areaFileError}" multiple></b-form-file>
					<small class="text-danger">{{areaFileError}}</small>
				</b-form-group>
			</b-col>
		</b-form-row>
		<b-form-row>
			<b-col>
				<b-form-group :label="locale.size + ':'">
					<b-form-radio-group v-model="demType" class="float-left" :options="['dem1','dem3']"></b-form-radio-group>
					<b-form-checkbox v-model="isResized" class="float-right">resized</b-form-checkbox>
				</b-form-group>
			</b-col>
		</b-form-row>
	</b-container>
	<template slot="modal-footer">
		<b-button variant="primary" @click="upload">
			<font-awesome-icon icon="spinner" spin v-if="showSpinner"></font-awesome-icon>
			{{locale.upload}}
		</b-button>
		<b-button @click="hide">{{locale.cancel}}</b-button>
	</template>
</b-modal>
</template>

<script>
import api from '@/assets/api';
import localization from '@/assets/localization';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			locale: localization,
			groundTruth: '',
			availableGroundThruths: [],
			groundTruthError: '',
			tpFile: null,
			tpFileError: '',
			fpFile: null,
			fpFileError: '',
			areaFiles: [],
			areaFileError: '',
			demType: "dem1",
			isResized: false,
			showSpinner: false
		}
	},

	/**
	 * Called after the component instance is created.
	 */
	created() {
		api.sources.list()
		.then(sources => {
			sources = sources.filter(x => x.type === 'public');
			let gt = [{ text: localization.select_source + '...', value: '' }]
			gt = gt.concat(sources.map(source => source.id));
			this.availableGroundThruths = gt;
		})
		.catch(err => {
			Utils.Error('Could not retrieve the peak sources', err);
		});
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Shows the modal window.
		 */
		show() {
			this.$refs.modal.show();
		},

		/**
		 * Hides the modal window.
		 */
		hide() {
			this.$refs.modal.hide();
		},

		/**
		 * Uploads the DEM extracted peaks.
		 * @param {MouseEvent} event
		 */
		upload() {
			this.groundTruthError = '';
			this.tpFileError = '';
			this.fpFileError = '';
			this.areaFileError = '';
			if (this.groundTruth === '') {
				this.groundTruthError = localization.select_source;
				return;
			}
			if (!this.tpFile) {
				this.tpFileError = localization.file_empty_error;
				return;
			}
			if (!this.fpFile) {
				this.fpFileError = localization.file_empty_error;
				return;
			}
			this.showSpinner = true;
			let description = `Type: ${this.demType}`;
			if (this.isResized) description += ' resized';
			api.sources.createDemExtracted(
				this.tpFile,
				this.fpFile,
				this.areaFiles,
				description,
				this.groundTruth,
				this.demType,
				this.isResized)
			.then(() => {
				this.$refs.tpFile.reset();
				this.$refs.fpFile.reset();
				this.$refs.areaFiles.reset();
				this.hide();
				this.$emit('success');
			})
			.catch(err => {
				Utils.Error('Could not upload the peaks', err);
			})
			.finally(() => {
				this.showSpinner = false
			});
		}
	}
}
</script>

<style>
.custom-file-label {
	overflow: hidden;
}
</style>
