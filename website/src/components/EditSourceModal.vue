<!--
This component is a self contained modal for editing a peak source.

Parameters:
- sourceId: ID of the source to edit.

Events:
- success: a peak source has been successfully edited.
-->

<template>
<b-modal ref="modal" :title="locale.edit">
	<b-container fluid>
		<b-form-row>
			<b-col>
				<b-form-group label="ID:">
					<b-input v-model="id"></b-input>
					<small class="text-danger">{{idError}}</small>
				</b-form-group>
			</b-col>
		</b-form-row>
		<b-form-row>
			<b-col>
				<b-form-group :label="locale.description + ':'">
					<b-form-textarea v-model="description" rows="3"></b-form-textarea>
					<small class="text-danger">{{descriptionError}}</small>
				</b-form-group>
			</b-col>
		</b-form-row>
	</b-container>
	<template slot="modal-footer">
		<b-button variant="primary" @click="update">
			<font-awesome-icon icon="spinner" spin v-if="showSpinner"></font-awesome-icon>
			{{locale.save}}
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
			sourceId: '',
			id: '',
			idError: '',
			description: '',
			descriptionError: '',
			showSpinner: false
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Shows the modal window.
		 * @param {string} sourceId
		 */
		show(sourceId) {
			this.sourceId = sourceId;
			api.sources.getInfo(sourceId)
			.then(source => {
				this.id = source.id;
				this.description = source.description;
				this.$refs.modal.show();
			})
			.catch(err => {
				Utils.Error('Cannot retrieve the source info', err);
			});
		},

		/**
		 * Hides the modal window.
		 */
		hide() {
			this.$refs.modal.hide();
		},

		/**
		 * Updates the source.
		 */
		update() {
			this.idError = '';
			this.descriptionError = '';
			if (!this.id) {
				this.idError = locale.name_empty_error;
				return;
			}
			if (!this.description) {
				this.descriptionError = locale.description_empty_error;
				return;
			}
			this.showSpinner = true;
			api.sources.update(
				this.sourceId,
				{
					id: this.id !== this.sourceId ? this.id : undefined,
					description: this.description
				}
			)
			.then(() => {
				this.hide();
				this.$emit('success');
			})
			.catch(err => {
				if (err.response && err.response.status === 409) {
					this.idError = locale.name_exists;
					return;
				}
				Utils.Error('Could not update the source', err);
			})
			.finally(() => {
				this.showSpinner = false;
			});
		}
	}
}
</script>
