<!--
This view handles the password reset procedure.
-->

<template>
<b-container>
	<b-row align-h="center" style="margin-top:5rem">
		<b-col style="max-width:22rem;">
			<b-alert :show="success!=''" variant="success" class="mb-4">{{success}}</b-alert>
			<b-alert :show="error!=''" variant="danger" class="mb-4">{{error}}</b-alert>
		</b-col>
	</b-row>
	<b-row align-h="center">
		<b-col style="max-width:22rem;">
			<b-form @submit.prevent="sendEmail" v-if="showUserForm">
				<b-form-group>
					<b-form-input type="text" :placeholder="locale.username" :class="{'is-invalid':usernameError}" v-model="username" autofocus></b-form-input>
					<small class="text-danger">{{usernameError}}</small>
				</b-form-group>
				<b-form-group>
					<b-button type="submit" variant="primary" block>
						<font-awesome-icon icon="spinner" spin v-if="showSpinner"></font-awesome-icon>
						{{locale.send_email}}
					</b-button>
				</b-form-group>
			</b-form>
			<b-form @submit.prevent="resetPassword" v-if="showResetForm">
				<b-form-group>
					<b-form-input type="password" :placeholder="locale.password" :class="{'is-invalid':passwordError}" v-model="password1"></b-form-input>
				</b-form-group>
				<b-form-group>
					<b-form-input type="password" :placeholder="locale.repeat_pass" :class="{'is-invalid':passwordError}" v-model="password2"></b-form-input>
					<small class="text-danger">{{passwordError}}</small>
				</b-form-group>
				<b-form-group>
					<b-button type="submit" variant="primary" block>
						<font-awesome-icon icon="spinner" spin v-if="showSpinner"></font-awesome-icon>
						{{locale.set_pass}}
					</b-button>
				</b-form-group>
			</b-form>
		</b-col>
	</b-row>
</b-container>
</template>

<script>
import api from '@/assets/api';
import locale from '@/assets/localization';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			locale,
			error: '',
			success: '',
			username: '',
			usernameError: '',
			password1: '',
			password2: '',
			passwordError: '',
			code: '',

			// UI switches
			showUserForm: true,
			showResetForm: false,
			showSpinner: false
		}
	},

	/**
	 * Called after the component instance has been created.
	 */
	created() {
		let userId = this.$route.query.user_id;
		let code = this.$route.query.code;
		if (userId !== undefined && code !== undefined) {
			this.showUserForm = false;
			this.showResetForm = true;
			this.username = userId;
			this.code = code;
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		sendEmail() {
			this.success = '';
			this.usernameError = '';

			// check input fields
			if (!this.username.match(/^\w{5,}$/)) {
				this.usernameError = locale.username_error;
				return;
			}

			this.showSpinner = true;
			api.users.sendPasswordResetEmail(this.username)
			.then(ok => {
				if (ok) {
					this.success = locale.email_sent;
				} else {
					this.usernameError = locale.username_not_exists;
				}
			})
			.catch(err => {
				Utils.Error('Cannot send the email for resetting the password', err);
			})
			.finally(() => {
				this.showSpinner = false;
			});
		},

		resetPassword() {
			this.success = '';
			this.error = '';
			this.passwordError = '';

			// check input fields
			if (this.password1.length < 5) {
				this.passwordError = locale.pass_length;
				return;
			}
			if (this.password1 !== this.password2) {
				this.passwordError = locale.pass_match;
				return;
			}

			this.showSpinner = true;
			api.users.resetPassword(this.username, this.code, this.password1)
			.then(ok => {
				if (ok) {
					this.success = locale.pass_changed;
				} else {
					this.error = locale.invalid_pass_reset_link;
				}
			})
			.catch(err => {
				Utils.Error('Cannot reset the password', err);
			})
			.finally(() => {
				this.showSpinner = false;
			});
		}
	}
}
</script>