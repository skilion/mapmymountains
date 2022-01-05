<!--
This component handles the user registration procedure.

Parameters:
- to: URL to follow after registering.
-->

<template>
<b-form @submit.prevent="createUser">
	<b-form-group>
		<b-form-input type="text" :placeholder="locale.username" :class="{'is-invalid':usernameError}" v-model="username" autofocus></b-form-input>
		<small class="text-danger">{{usernameError}}</small>
	</b-form-group>
	<b-form-group>
		<b-form-input type="text" :placeholder="emailPlaceholder" :class="{'is-invalid':emailError}" v-model="email"></b-form-input>
		<small class="text-danger">{{emailError}}</small>
	</b-form-group>
	<b-form-group>
		<b-form-input type="password" :placeholder="locale.password" :class="{'is-invalid':passwordError}" v-model="password1"></b-form-input>
	</b-form-group>
	<b-form-group>
		<b-form-input type="password" :placeholder="locale.repeat_pass" :class="{'is-invalid':passwordError}" v-model="password2"></b-form-input>
		<small class="text-danger">{{passwordError}}</small>
	</b-form-group>
	<b-form-group>
		<b-button type="submit" variant="success" block>
			<font-awesome-icon icon="spinner" spin v-if="showSpinner"></font-awesome-icon>
			{{locale.create_account}}
		</b-button>
	</b-form-group>
</b-form>
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
			username: '',
			usernameError: '',
			email: '',
			emailError: '',
			password1: '',
			password2: '',
			passwordError: '',
			showSpinner: false
		}
	},

	/**
	 * Computed properties.
	 */
	computed: {
		emailPlaceholder() {
			if (!this.username) return locale.email_placeholder;
			const name = this.username ? this.username : 'james';
			return name + '@email.com';
		}
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		createUser(event) {
			this.success = '';
			this.usernameError = '';
			this.passwordError = '';
			this.emailError = '';
			if (!this.username.match(/^\w{5,}$/)) {
				this.usernameError = locale.username_error;
				return;
			}
			if (!this.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
				this.emailError = locale.email_valid;
				return;
			}
			if (this.password1.length < 5) {
				this.passwordError = locale.pass_length;
				return;
			}
			if (this.password1 !== this.password2) {
				this.passwordError = locale.pass_match;
				return;
			}
			this.showSpinner = true;
			api.users.create({
				id: this.username,
				password: this.password1,
				email: this.email
			}).then(() => {
				api.login(this.username, this.password1)
				.catch(err => {
					Utils.Error('Cannot login new user', err);
				})
				.then(() => {
					this.$router.push(this.to);
				});
			}).catch(err => {
				if (err.response && err.response.status === 409) {
					this.usernameError = locale.name_exists;
					return;
				}
				Utils.Error('Cannot create the user', err);
			})
			.finally(() => {
				this.showSpinner = false;
			});
		}
	}
}
</script>
