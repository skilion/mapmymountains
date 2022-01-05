<!--
This view combines login and registration for convenience.
-->

<template>
<b-container>
	<!-- Login -->
	<b-row align-h="center" style="margin-top:5rem">
		<h3>{{locale.are_you_registered}}</h3>
	</b-row>
	<b-row align-h="center" class="mt-3">
		<b-col style="max-width:22rem;">
			<login-form :to="redirectPath"></login-form>
		</b-col>
	</b-row>

	<!-- Registration -->
	<b-row align-h="center" style="margin-top:5rem">
		<h3>{{locale.invite_to_register}}</h3>
	</b-row>
	<b-row align-h="center" class="mt-3">
		<b-col style="max-width:22rem;">
			<registration-form :to="redirectPath"></registration-form>
		</b-col>
	</b-row>
</b-container>
</template>

<script>
import locale from '@/assets/localization';
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
			locale,
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
