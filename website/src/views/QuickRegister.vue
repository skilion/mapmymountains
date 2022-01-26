<!--
This view combines login and registration for convenience.
-->

<template>
<b-container>
	<!-- Login -->
	<b-row align-h="center" style="margin-top:5rem">
		<b-col style="max-width:22rem;">
			<login-form :to="redirectPath"></login-form>
		</b-col>
	</b-row>
	<b-row align-h="center" style="margin-top:5rem">
		<b-col style="max-width:22rem" class="text-center">
			<p><router-link to="/register">{{localization.create_account}}</router-link></p>
			<p><router-link to="/password_reset">{{localization.password_reset}}</router-link></p>
		</b-col>
	</b-row>
</b-container>
</template>

<script>
import localization from '@/assets/localization';
import LoginForm from '@/components/LoginForm.vue';
import RegistrationForm from '@/components/RegistrationForm.vue';

export default {
	/**
	 * Locally registered components.
	 */
	components: {
		LoginForm,
		RegistrationForm
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			localization,
			redirectPath: '/campaigns'
		}
	},

	/**
	 * Called after the component instance has been created.
	 */
	created() {
		let redirectPath = this.$route.query.redirect;
		if (redirectPath !== undefined) {
			this.redirectPath = redirectPath;
		}
	},
}
</script>
