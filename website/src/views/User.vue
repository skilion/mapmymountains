<!--
This view shows the user details.
-->

<template>
<b-container>
	<b-row class="my-3">
		<b-col>
			<h1>{{localization.settings}}</h1>
		</b-col>
	</b-row>
	<b-row class="mb-5">
		<b-col cols="5">
			<b-form @submit="setEmail">
				<b-form-group>
					<label>{{localization.curr_email}}: {{user.email ? user.email : 'loading'}}</label>
					<b-form-input type="text" :placeholder="localization.new_email" :class="{'is-invalid':emailError}" v-model="email"></b-form-input>
					<small class="text-danger">{{emailError}}</small>
				</b-form-group>
				<b-button type="submit">{{localization.set_email}}</b-button>
			</b-form>
		</b-col>
	</b-row>
	<b-row class="mb-5">
		<b-col cols="5">
			<b-form @submit="setPassword">
				<b-form-group>
					<label>{{localization.new_pass}}</label>
					<b-form-input type="password" :placeholder="localization.password" :class="{'is-invalid':passwordError}" v-model="password1"></b-form-input>
				</b-form-group>
				<b-form-group>	
					<b-form-input type="password" :placeholder="localization.repeat_pass" :class="{'is-invalid':passwordError}" v-model="password2"></b-form-input>
					<small class="text-danger">{{passwordError}}</small>
				</b-form-group>
				<b-button type="submit">{{localization.set_pass}}</b-button>
			</b-form>
		</b-col>
	</b-row>
	<b-row class="mb-5">
		<b-col>
			<label>{{localization.preferred_area}}:</label>
			<select-area id="select-area" class="mb-3" v-model="area" nopeaksindicator></select-area>
			<b-button v-on:click="setPreferredArea">{{localization.set_area}}</b-button>
		</b-col>
	</b-row>
</b-container>
</template>

<script>
import api from '@/assets/api';
import localization from '@/assets/localization';
import Map2D from '@/components/Map2D.vue';
import SelectArea from '@/components/SelectArea.vue';
import Vue from 'vue';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Locally registered components.
	 */
	components: {
		SelectArea
	},

	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			api,
			localization,
			user: {},
			email: '',
			emailError: '',
			password1: '',
			password2: '',
			passwordError: '',
			area: []
		}
	},

	/**
	 * Called after the component instance has been created.
	 */
	created() {
		this.reload();
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Sets the email for the current user.
		 * @param {MouseEvent} event
		 */
		setEmail(event) {
			event.preventDefault();
			this.emailError = '';
			if (!this.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
				this.emailError = localization.email_valid;
				return;
			}
			api.users.update(api.userId, { email: this.email })
			.then(user => {
				this.email = '';
				Utils.MessageBox(localization.notice, localization.email_changed);
				this.reload();
			})
			.catch(err => {
				Utils.Error('Cannot set the email', err);
			});
		},

		/**
		 * Sets the password for the current user.
		 * @param {MouseEvent} event
		 */
		setPassword(event) {
			event.preventDefault();
			this.passwordError = '';
			if (this.password1.length < 5) {
				this.passwordError = localization.pass_length;
				return;
			}
			if (this.password1 !== this.password2) {
				this.passwordError = localization.pass_match;
				return;
			}
			api.users.update(api.userId, { password: this.password1 })
			.then(user => {
				this.password1 = '';
				this.password2 = '';
				Utils.MessageBox(localization.notice, localization.pass_changed);
			})
			.catch(err => {
				Utils.Error('Cannot change the password', err);
			});
		},

		/**
		 * Sets the preferred area for the current user.
		 */
		setPreferredArea() {
			api.users.update(api.userId, { preferred_area: this.area })
			.then(user => {
				Utils.MessageBox(localization.notice, localization.new_area_set);
			})
			.catch(err => {
				Utils.Error('Cannot set the preferred area', err);
			});
		},

		/**
		 * Reload the user object.
		 */
		reload() {
			api.users.get(api.userId)
			.then(user => {
				this.user = user;
				this.area = user.preferred_area;
			})
			.catch(err => {
				Utils.Error('Cannot load the user data', err);
			});
		}
	}

}
</script>

<style>
#select-area {
	height: 40rem;
}
</style>
