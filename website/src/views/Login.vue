<!--
This view handles the user login and the activation of new users.
-->

<template>
<b-container>
	<b-row align-h="center" style="margin-top:5rem">
		<b-col style="max-width:22rem;">
			<b-alert :show="error!=''" variant="danger" class="mb-4">{{error}}</b-alert>
			<b-alert :show="success!=''" variant="success" class="mb-4">{{success}}</b-alert>
			<login-form to="/campaigns"></login-form>
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
import api from '@/assets/api';
import localization from '@/assets/localization';
import LoginForm from '@/components/LoginForm.vue';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Locally registered components.
	 */
	components: {
		LoginForm
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			localization,
			error: '',
			success: '',
			username: '',
			code: ''
		}
	},

	/**
	 * Called after the component instance has been created.
	 */
	created() {
		// check if an user is being activated
		let userId = this.$route.query.user_id;
		let code = this.$route.query.code;
		if (userId !== undefined && code !== undefined) {
			this.username = userId;
			this.code = code;
			this.activateUser();
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Activates an user account.
		 */
		activateUser() {
			api.users.activate(this.username, this.code)
			.then(ok => {
				if (ok) {
					this.success = localization.user_activation_ok;
				} else {
					this.error = localization.invalid_user_activation_link;
				}
			}).catch(err => {
				Utils.Error('Cannot activate the account', err);
			});
		}
	}
}
</script>