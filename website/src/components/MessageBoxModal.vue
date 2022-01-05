<!--
This component is a modal window to show custom messages.

Do not use directly. Use MessageBox() from Utils.js instead.

Parameters:
- message: the message to show
- err: an error object to show advanced details
-->

<template>
<b-modal ref="msgbox" :title="title" visible centered
	:cancel-title="locale.cancel"
	:ok-only="okOnly"
	@cancel="$emit('cancel')"
	@hide="$emit('hide')"
	@hidden="$emit('hidden')"
	@ok="$emit('ok')">
	<p>{{message}}</p>
</b-modal>
</template>

<script>
import locale from '@/assets/localization';

export default {
	/**
	 * Component properties.
	 */
	props: {
		title: String,
		message: String,
		okOnly: Boolean
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			locale
		}
	}
}
</script>
