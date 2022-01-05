<!--
This component shows a modal window with the details of the given peak.

Parameters:
[all properties of a peak]
-->

<template>
<b-modal ref="peakDetailsModal" :title="title" centered ok-only>
	<div v-if="source_id">{{locale.source}}: {{source_id}}</div>
	<div v-if="source_type == 'osm'">OpenStreetMap ID: {{osm_id}}</div>
	<div v-if="source_type == 'geonames'">GeoNames ID: {{geoname_id}}</div>
	<div v-if="source_type == 'custom'">Custom ID: {{custom_id}}</div>
	<div>MapMyMountains Peak ID: {{id}}</div>
	<div v-if="alternate_names && alternate_names.length > 0">{{locale.alternate_names}}:
		<ul style="max-height: 10rem; overflow: auto">
			<li v-for="v in alternate_names" :key="v.isolanguage + v.alternate_name">
				{{v.isolanguage ? (v.isolanguage + ': ') : ''}}{{v.alternate_name}}
			</li>
		</ul>
	</div>
	<div>{{locale.gps_coords}}: {{lat}}, {{lon}}</div>
	<div v-if="elevation">{{locale.elevation}}: {{elevation}}m</div>
	<div v-if="wikipedia_link">Wikipedia Link: {{wikipedia_link}}</div>
	<div v-if="wikidata_id">Wikidata ID: {{wikidata_id}}</div>
</b-modal>
</template>

<script>
import locale from '@/assets/localization';

export default {
	/**
	 * Component properties.
	 */
	props: {
		modal_id: String,
		source_id: String,
		id: Number,
		name: String,
		alternate_names: Array,
		lat: Number,
		lon: Number,
		elevation: Number,
		wikipedia_link: String,
		wikidata_id: String,
		source_type: String,
		osm_id: String,
		geoname_id: Number,
		custom_id: String
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			locale
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		title() {
			if (this.name) return this.name;
			return `${locale.anonymous} ${this.id}`;
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		show() {
			this.$refs.peakDetailsModal.show();
		}
	}
}
</script>

<style>
</style>
