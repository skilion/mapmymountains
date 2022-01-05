<!--
This components handles the user login.

Parameters:
- to: URL to follow after login.
-->

<template>
<div>
	<b-alert :show="error!=''" variant="danger" class="mb-4">{{error}}</b-alert>

	<b-form @submit.prevent="login">
		<b-form-group>
			<b-form-input type="text" :placeholder="locale.username" :class="{'is-invalid':usernameError}" v-model="username" autofocus></b-form-input>
			<small class="text-danger">{{usernameError}}</small>
		</b-form-group>
		<b-form-group>
			<b-form-input id='pass' type="password" :placeholder="locale.password" :class="{'is-invalid':passwordError}" v-model="password"></b-form-input>
			<small class="text-danger">{{passwordError}}</small>
		</b-form-group>
		<b-form-group>
			<b-button type="submit" variant="primary" block>
				<font-awesome-icon icon="spinner" spin v-if="showSpinner"></font-awesome-icon>
				{{locale.login}}
			</b-button>
		</b-form-group>
	</b-form>
</div>
</template>

<script>
import api from '@/assets/api';
import locale from '@/assets/localization';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Component properties.
	 */
	props: {
		to: String
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			locale,
			error: '',
			username: '',
			usernameError: '',
			password: '',
			passwordError: '',
			showSpinner: false
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		login() {
			// clear errors
			this.error = '';
			this.usernameError = '';
			this.passwordError = '';

			// sanity checks
			if (!this.username.match(/^\w{5,}$/)) {
				this.usernameError = locale.username_error;
				return;
			}
			if (this.password.length < 5) {
				this.passwordError = locale.pass_length;
				return;
			}

			// actual login operation
			this.showSpinner = true;
			api.login(this.username, this.password)
			.then(ok => {
				if (ok) {
					this.$router.push(this.to);
				} else {
					this.error = locale.wrong_user_pass;
				}
			}).catch(err => {
				Utils.Error('Cannot login', err);
			})
			.finally(() => {
				this.showSpinner = false;
			});
		}
	}
}
</script>