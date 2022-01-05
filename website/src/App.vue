<!--
This is the master view that shows all the others.
-->

<template>
<div id="app">
	<b-navbar class="z-index-500" toggleable="md" variant="light" type="light" v-if="$router.currentRoute.path!='/annotator'">
		<b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
		<b-navbar-brand to="/">MapMyMountains</b-navbar-brand>
		<b-collapse is-nav id="nav_collapse">
			<b-navbar-nav>
				<b-nav-item to="/campaigns" v-if="api.hasPermission('create_annotation')">
					{{localization.campaigns}}
				</b-nav-item>
				<b-nav-item to="/stats" v-if="api.hasPermission('view_stats')">
					{{localization.statistics}}
				</b-nav-item>
				<b-nav-item to="/sources" v-if="api.hasPermission('upload_peaks')">
					{{localization.sources_of_peaks}}
				</b-nav-item>
				<b-nav-item to="/explore" v-if="api.hasPermission('search')">
					{{localization.search}}
				</b-nav-item>
				<b-nav-item to="/quick" v-if="api.hasPermission('upload_peaks')">
					Quick View
				</b-nav-item>
				<b-nav-item to="/user_list" v-if="api.hasPermission('edit_users')">
					{{localization.users}}
				</b-nav-item>
			</b-navbar-nav>

			<b-navbar-nav class="ml-auto">
				<b-nav-item-dropdown right>
					<template slot="button-content">
						<font-awesome-icon icon="language"></font-awesome-icon> {{localization.getLanguageName()}}
					</template>
					<b-dropdown-item v-on:click="localization.setLanguage('it')" :active="localization.getLanguage() == 'it'">Italiano</b-dropdown-item>
					<b-dropdown-item v-on:click="localization.setLanguage('en')" :active="localization.getLanguage() == 'en'">English</b-dropdown-item>
				</b-nav-item-dropdown>

				<b-nav-item-dropdown v-if="loggedIn" right>
					<template slot="button-content">
						<font-awesome-icon icon="user"></font-awesome-icon> {{api.userId}}
					</template>
					<b-dropdown-item to="/user">{{localization.settings}}</b-dropdown-item>
					<b-dropdown-item v-on:click="logout">{{localization.logout}}</b-dropdown-item>
				</b-nav-item-dropdown>

				<b-nav-item to="/login" v-if="!['/quick_register','/login'].includes($router.currentRoute.path) && !loggedIn" right>
					<font-awesome-icon icon="user"></font-awesome-icon> {{localization.login}}
				</b-nav-item>
			</b-navbar-nav>
		</b-collapse>
	</b-navbar>
	<router-view></router-view>
</div>
</template>

<script>
import Cookies from 'cookies-js';
import api from '@/assets/api';
import localization from '@/assets/localization';

export default {
	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			api,
			localization
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		loggedIn() {
			return this.api.loggedIn;
		}
	},

	/**
	 * Called before the component instance is created.
	 */
	beforeCreate() {
		// init libraries
		api.init()
		.then(ok => {
			if (!ok) {
				// redirect to login page if not logged in
				let path = this.$router.currentRoute.path;
				let freePaths = ['/', '/explore', '/login', '/quick_register', '/register', '/password_reset'];
				if (!freePaths.includes(path)) {
					console.log('Not logged in: redirect to login');
					this.$router.replace({
						path: '/quick_register',
						query: {
							redirect: this.$router.currentRoute.fullPath
						}
					});
				}
			}
		});

		localization.init();
	},

	/**
	 * Custom methods.
	 */
	methods: {
		/**
		 * Performs the logout.
		 */
		logout() {
			api.logout();
			this.$router.push('/login');
		}
	}
}
</script>

<style>
/* Fix navbar being covered by the box-shadow of SidePanelLayout */
.z-index-500 {
	z-index: 500;
}
</style>
