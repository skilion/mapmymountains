<!--
This view shows the list of peak sources.
-->

<template>
<b-container>
	<b-row class="mt-3">
		<b-col>
			<h1>{{locale.sources_of_peaks}}</h1>
		</b-col>
	</b-row>
	<b-row align-h="between" class="mt-3">
		<b-col>
			<b-form-select v-model="selectedType" style="width:auto">
				<option value="public">{{locale.generic_peaks}}</option>
				<option value="dem_extracted">{{locale.peaks_from_dem}}</option>
			</b-form-select>
		</b-col>
		<b-col>
			<b-button class="float-right mr-4" @click="add">{{locale.add}}</b-button>
		</b-col>
	</b-row>
	<b-row class="mt-3">
		<b-col v-if="sources.length === 0">
			<p>{{locale.no_source_available}}.</p>
		</b-col>
    </b-row>
	<b-row>
		<b-col>
			<b-list-group>
				<b-list-group-item v-for="source in sources" :key="source.id">
					{{source.id}}<span class="text-secondary"> - {{source.description}}</span>
					<b-button variant="danger" class="float-right" @click="deleteSource(source.id)" size="sm">
						{{locale.delete}}
					</b-button>
					<b-button class="mr-2 float-right" @click="editSource(source.id)" size="sm">
						{{locale.edit}}
					</b-button>
					<b-button class="mr-2 float-right" :to="`/peaks?source_id=${encodeURIComponent(source.id)}`" size="sm">
						{{locale.open}}
					</b-button>
				</b-list-group-item>
			</b-list-group>
		</b-col>
	</b-row>

	<upload-peaks-window ref="uploadPeaks" @success="reload"></upload-peaks-window>
	<upload-dem-peaks-window ref="uploadDemPeaks" @success="reload"></upload-dem-peaks-window>
	<edit-source-modal ref="editSourceModal" @success="reload"></edit-source-modal>
</b-container>
</template>

<script>
import api from '@/assets/api';
import locale from '@/assets/localization';
import EditSourceModal from '@/components/EditSourceModal';
import UploadDemPeaksWindow from '@/components/UploadDemPeaksWindow';
import UploadPeaksWindow from '@/components/UploadPeaksWindow';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Locally registered components.
	 */
	components: {
		EditSourceModal,
		UploadDemPeaksWindow,
		UploadPeaksWindow
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			locale,
			selectedType: 'public',
			allSources: []
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		sources() {
			// keep only the public sources of peaks
			let sources = this.allSources.filter(x => x.type === this.selectedType);
			// sort ascending
			sources.sort((a, b) => a.id < b.id ? -1 : 1);
			return sources;
		}
	},

	/**
	 * Called after the component instance is created.
	 */
	created() {
		// check if the user has logged in
		if (!api.loggedIn) return;
		
		this.reload();
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Reload the peak sources.
		 */
		reload() {
			api.sources.list()
			.then(sources => {
				this.allSources = sources;
			})
			.catch(err => {
				Utils.Error('Could not retrieve the peak sources', err);
			});
		},

		/**
		 * Called when the add button is clicked.
		 */
		add() {
			if (this.selectedType == 'public') {
				this.$refs.uploadPeaks.show();
			} else {
				this.$refs.uploadDemPeaks.show();
			}
		},

		/**
		 * Open the edit modal for the the given source.
		 * @param {string} sourceId
		 */
		editSource(sourceId) {
			this.$refs.editSourceModal.show(sourceId);
		},

		/**
		 * Deletes the given source.
		 * @param {string} sourceId
		 */
		deleteSource(sourceId) {
			if (!confirm(locale.delete_source_confirm)) return;
			api.sources.delete(sourceId)
			.then(() => {
				Utils.MessageBox(locale.alert, locale.source_deleted);
				this.reload();
			})
			.catch(err => {
				Utils.Error('Could not delete the peak source', err);
			})
		}
	}
}
</script>
