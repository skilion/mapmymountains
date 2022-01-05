<!--
This component is a modal window to show custom errors.

Do not use directly. Use Error() from Utils.js instead.

Parameters:
- message: the message to show
- err: an error object to show advanced details
-->

<template>
<b-modal visible centered ok-only
	header-text-variant="danger"
	:title="locale.error"
	@hide="$emit('hide')"
	@hidden="$emit('hidden')">
	<p>{{message}}</p>
	<b-btn class="mb-3" v-b-toggle.collapse v-if="detailsHtml" size="sm" variant="link">Advanced details...</b-btn>
	<b-collapse id="collapse" v-if="detailsHtml">
		<b-card>
			<div v-html="detailsHtml"></div>
		</b-card>
	</b-collapse>
</b-modal>
</template>

<script>
import locale from '@/assets/localization';

export default {
	/**
	 * Component properties.
	 */
	props: {
		message: String,
		error: Object
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
		/**
		 * Computes a HTML representation of the error object.
		 * @returns {string}
		 */
		detailsHtml() {
			if (!this.error) return "";
			if (this.error.response) {
				return this.error.response.data.toString();
			}
			return this.error.toString();
		}
	},
}
</script>
