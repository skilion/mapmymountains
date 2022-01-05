<!--
This component shows a card with the details of the given peak.

Parameters:
[all properties of a peak]
-->

<template>
	<b-card border-variant="info">
		<template slot="header" class="align-middle">
			<h6 class="m-0">
				{{title}}
				<b-btn
					id="share-peak-btn"
					class="float-right m-0 p-0"
					variant="link">
					<font-awesome-icon class="m-0 p-0" icon="share-alt">
					</font-awesome-icon>
				</b-btn>
			</h6>
			<b-popover
				target="share-peak-btn"
				triggers="click blur"
				placement="top"
				:title="locale.share">
				<b-input-group size="sm">
					<b-form-input id="share-peak-input" v-model="sharePeakLink" onclick="this.select()" readonly></b-form-input>
      				<b-btn slot="append" @click="copyPeakLink">
						  <font-awesome-icon icon="clipboard">
						</font-awesome-icon>
					</b-btn>
					<b-btn slot="append" :href="mailtoPeakLink" target="_blank">
						  <font-awesome-icon icon="envelope">
						</font-awesome-icon>
					</b-btn>
					
				</b-input-group>
			</b-popover>
		</template>
		<div v-if="source_id">{{locale.source}}: {{source_id}}</div>
		<div v-if="source_type == 'cgn'">CGN Toponomyc ID: {{cgn_toponymic_id}}</div>
		<div v-if="source_type == 'ct10'">CT10 ID: {{ct10_cod_ele}}</div>
		<div v-if="source_type == 'osm'">OpenStreetMap ID: {{osm_id}}</div>
		<div v-if="source_type == 'geonames'">GeoNames ID: {{geoname_id}}</div>
		<div v-if="source_type == 'custom'">Custom ID: {{custom_id}}</div>
		<div>MapMyMountains Peak ID: {{id}}</div>
		<div v-if="alternate_names && alternate_names.length > 0">{{localization.alternate_names}}:
			<ul style="max-height: 10rem; overflow: auto">
				<li v-for="v in alternate_names" :key="v.isolanguage + v.alternate_name">
					{{v.isolanguage ? (v.isolanguage + ': ') : ''}}{{v.alternate_name}}
				</li>
			</ul>
		</div>
		<div>{{locale.gps_coords}}: {{lat}}, {{lon}}</div>
		<div v-if="elevation">{{locale.elevation}}: {{elevation}}m</div>
		<div v-if="wikipedia_link">Wikipedia Link: <a :href="wikipediaLink">{{wikipedia_link}}</a></div>
		<div v-if="wikidata_id">Wikidata ID: <a :href="wikidataLink">{{wikidata_id}}</a></div>
		<slot></slot>
	</b-card>
</template>

<script>
import locale from '@/assets/localization';

export default {
	/**
	 * Component properties.
	 */
	props: {
		id: Number,
		source_id: String,
		name: String,
		alternate_names: Array,
		lat: Number,
		lon: Number,
		elevation: Number,
		wikipedia_link: String,
		wikidata_id: String,
		source_type: String,
		cgn_toponymic_id: String,
		ct10_cod_ele: String,
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
		},

		/**
		 * Returns a proper URL to Wikipeda.
		 */
		wikipediaLink() {
			if (!this.wikipedia_link) return '#';
			let colonIndex = this.wikipedia_link.indexOf(':');
			if (colonIndex === -1) return '#';
			let lang = this.wikipedia_link.slice(0, colonIndex);
			let title = encodeURIComponent(this.wikipedia_link.slice(colonIndex + 1));
			return `https://${lang}.wikipedia.org/wiki/${title}`;
		},

		/**
		 * Returns a proper URL to Wikidata.
		 */
		wikidataLink() {
			if (!this.wikidata_id) return '#';
			return `https://www.wikidata.org/wiki/${this.wikidata_id}`;
		},

		/**
		 * Returns a link to the peak in the Explore view.
		 */
		sharePeakLink: {
			get() {
				return window.location.host + this.$router.currentRoute.fullPath;
			},
			set(value) {} // suppress Vue warning
		},

		/**
		 * Returns a mailto link that creates an email with a link to the peak.
		 */
		mailtoPeakLink() {
			let subject = encodeURIComponent(locale.share_peak_email_subject);
			let body = encodeURIComponent(locale.share_peak_email_body + `\n\n${this.sharePeakLink}`);
			return `mailto:?subject=${subject}&body=${body}`;
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Copies the share link peak to the clipboard.
		 */
		copyPeakLink() {
			document.getElementById('share-peak-input').select();
			document.execCommand('copy');
		}
	}
}
</script>
