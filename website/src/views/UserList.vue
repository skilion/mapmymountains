<!--
This view shows all the users and allows to delete them or toggle their permissions
-->

<template>
<b-container>
	<b-row class="my-3">
		<b-col>
			<h1>{{locale.users}}</h1>
		</b-col>
	</b-row>
	<b-row class="mb-3">
		<b-col>
			<b-table sort-by="id" :items="users" :fields="fields">
				<template #cell(creation_time)="data">
					{{new Date(data.value).toLocaleString(locale.getLanguage(), { timeZone: 'UTC' })}}
				</template>
				<template #cell(permissions)="data">
					<b-form-checkbox-group
						v-model="data.item.permissions"
						:options="user_permissions"
						@change="updateUserPermissions(data.item)"
						stacked>
					</b-form-checkbox-group>
				</template>
			</b-table>
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
			users: [],
			fields: [
				'id',
				'creation_time',
				'email',
				'active',
				'permissions',
			],
			user_permissions: [
				'create_annotation',
				'create_campaign', 
				'edit_element',
				'upload_peaks',
				'view_stats',
				'edit_users',
				'search'
			]
		}
	},

	/**
	 * Called after the component instance is created.
	 */
	created() {
		// check if the user has logged in
		if (!api.loggedIn) return;

		this.refresh();
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Reload the user list.
		 */
		refresh() {
			api.users.list()
			.then(users => {
				this.users = users;
			})
			.catch(err => {
				Utils.Error('Cannot load the user list', err);
			})
		},

		/**
		 * Update the given user permission
		 */
		updateUserPermissions(user) {
			if (this.updateTimeout) {
				clearTimeout(this.updateTimeout)
			}
			this.updateTimeout = setTimeout(() => {
				api.users.update(
					user.id,
					{
						permissions: user.permissions
					}
				)
				.catch(err => {
					Utils.Error('Cannot update the user permissions', err);
				})
				.finally(() => {
					this.updateTimeout = undefined;
				});
			}, 1000);
		}
	}
}
</script>
