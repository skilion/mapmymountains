<!--
This component is a self contained modal for uploading a peak source.

Events:
- success: a peak source has been successfully uploaded.

-->

<template>
<b-modal ref="modal" :title="locale.add">
	<b-container fluid>
		<b-form-row>
			<b-col>
				<b-form-group :label="locale.name + '*:'">
					<b-input v-model="name"></b-input>
					<small class="text-danger">{{nameError}}</small>
				</b-form-group>
			</b-col>
		</b-form-row>
		<b-form-row>
			<b-col>
				<b-form-group :label="locale.description + '*:'">
					<b-form-textarea v-model="description" rows="3"></b-form-textarea>
					<small class="text-danger">{{descriptionError}}</small>
				</b-form-group>
			</b-col>
		</b-form-row>
		<b-form-row>
			<b-col>
				<b-form-group :label="locale.peaks_file + '*:'">
					<b-form-file ref="peakFile" accept=".json,application/json" v-model="peakFile" :class="{'is-invalid':peakFileError}"></b-form-file>
					<small class="text-danger">{{peakFileError}}</small>
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
import locale from '@/assets/localization';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			locale,
			name: '',
			nameError: '',
			description: '',
			descriptionError: '',
			peakFile: null,
			peakFileError: '',
			showSpinner: false
		}
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
			this.nameError = '';
			this.descriptionError = '';
			this.peakFileError = '';
			if (!this.name) {
				this.nameError = locale.name_empty_error;
				return;
			}
			if (!this.description) {
				this.descriptionError = locale.description_empty_error;
				return;
			}
			if (!this.peakFile) {
				this.peakFileError = locale.file_empty_error;
				return;
			}
			this.showSpinner = true;
			api.sources.create(
				this.name,
				this.description,
				this.peakFile)
			.then(() => {
				this.name = '';
				this.description = '';
				this.$refs.peakFile.reset();
				this.hide();
				this.$emit('success');
			})
			.catch(err => {
				if (err.response && err.response.status === 409) {
					this.nameError = locale.name_exists;
					return;
				}
				Utils.Error('Could not upload the peaks', err);
			})
			.finally(() => {
				this.showSpinner = false;
			});
		}
	}
}
</script>

<style>
</style>
