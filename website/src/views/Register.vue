<!--
This view handles the user registration procedure.
-->

<template>
<b-container>
	<b-row align-h="center" style="margin-top:5rem">
		<b-col style="max-width:22rem">
			<registration-form to="/campaigns"></registration-form>
		</b-col>
	</b-row>
</b-container>
</template>

<script>
import api from '@/assets/api';
import localization from '@/assets/localization';
import RegistrationForm from '@/components/RegistrationForm.vue';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Locally registered components.
	 */
	components: {
		RegistrationForm
	}
}
</script>
