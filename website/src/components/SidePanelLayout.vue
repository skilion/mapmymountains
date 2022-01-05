<!--
This component shows body with a togglable side panel on the left.

Slots:
- left-panel-body: content of the side panel
- body: main content

-->

<template>
<div class="d-flex">
	<div class="side-panel-container">
		<div class="side-panel bg-light" v-if="showSidePanel">
			<slot name="left-panel-body">
			</slot>
		</div>
		<div class="side-panel-toggle">
			<div class="side-panel-toggle-button bg-light text-secondary" @click="sidePanelToggle">
				<font-awesome-icon v-if="showSidePanel" icon="caret-left"></font-awesome-icon>
				<font-awesome-icon v-if="!showSidePanel" icon="caret-right"></font-awesome-icon>
			</div>
		</div>
	</div>
	<div class="body-container flex-fill">
		<slot name="body">
		</slot>
	</div>
</div>
</template>

<script>
export default {
	/**
	 * Component properties.
	 */
	props: {
		showPanel: {
			type: Boolean,
			default: true
		}
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			showSidePanel: true
		}
	},

	/**
	 * Methods for the Vue instance.
	 */
	methods: {
		/**
		 * Toggles the side panel visibility.
		 */
		sidePanelToggle() {
			this.showSidePanel = !this.showSidePanel;
		}
	},

	/**
	 * Custom watchers.
	 */
	watch: {
		showPanel: {
			immediate: true,
			handler(value) {
				this.showSidePanel = value;
			}
		}
	}
}
</script>

<style>
.body-container {
	position: relative;
	height: 100%;
}
.side-panel-container {
	box-shadow: 0 0 1rem rgba(0,0,0,.3);
	position: relative;
	height: 100%;
	z-index: 450;
}
.side-panel {
	width: 25rem;
	height: 100%;
	position: relative;
	overflow-x: hidden;
	overflow-y: auto;
	z-index: 450;
}
.side-panel-toggle {
	position: absolute;
	top: 1rem;
	left: 100%;
	z-index: 440;
	cursor: pointer;
}
.side-panel-toggle-button {
	position: absolute;
	width: 1.5rem;
	height: 3rem;
	line-height: 3.25rem;
	text-align: center;
	cursor: pointer;
	box-shadow: 0 0 .5rem rgba(0,0,0,.3);
	border-left: 1px solid rgba(150,150,150);
	opacity: 0.9;
}
</style>
