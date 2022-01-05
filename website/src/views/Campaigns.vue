<!--
This view shows the available campaigns
-->

<template>
<b-container>
	<b-row class="my-3">
		<b-col>
			<h1>{{localization.campaigns}}</h1>
		</b-col>
	</b-row>

	<b-row class="mb-3">
		<b-col>
			<p class="float-left" v-if="campaigns.length == 0">
				{{localization.no_campaigns_available}}.
			</p>
			<b-button
				class="float-right"
				to="/create_campaign"
				v-if="api.hasPermission('create_campaign')">
				{{localization.create_campaign}}
			</b-button>
		</b-col>
	</b-row>

	<!-- Campaigns list -->
	<b-row>
		<b-col lg="4" class="mb-4" v-for="(campaign) in campaigns" :key="campaign.id">
			<b-card style="height:100%" no-body>
				<h4 slot="header">{{campaign.name}}</h4>
				<b-card-body>
					<p class="card-text">{{campaign.description}}</p>
				</b-card-body>
				<b-card-footer style="background-color:#fff">
					<p class="card-text" :class="{'red-color': new Date(campaign.end_time) < new Date()}">
						{{localization.ends_on}}: {{new Date(campaign.end_time).toLocaleDateString(localization.getLanguage(), { timeZone: 'UTC' })}}
					</p>
					<b-progress :max="campaign.num_peaks">
			      <b-progress-bar :value="campaign.num_annotations">
			        <div class="progress-bar-title">{{campaign.num_annotations}}/{{campaign.num_peaks}}</div>
			      </b-progress-bar>
			    </b-progress>
				</b-card-footer>
				<b-card-footer>
					<b-button class="mr-2 mb-1" size="sm" :to="`/annotator?campaign=${campaign.id}`">
						{{localization.open}}
					</b-button>
					<template v-if="api.hasPermission('view_stats')">
						<b-button class="mr-2 mb-1" size="sm" :to="`/annotations?campaign_id=${campaign.id}`">
							{{localization.annotations}}
						</b-button>
					</template>
					<template v-if="api.hasPermission('create_campaign')">
						<b-button class="mr-2 mb-1" size="sm" :to="`/create_campaign?campaign_id=${campaign.id}`">
							{{localization.edit}}
						</b-button>
						<b-button class="mb-1" size="sm" @click="deleteCampaign(campaign.id)" variant="danger">
							{{localization.delete}}
						</b-button>
					</template>
				</b-card-footer>
			</b-card>
		</b-col>
	</b-row>
</b-container>
</template>

<script>
import api from '@/assets/api';
import localization from '@/assets/localization';
import * as Utils from '@/components/Utils';

export default {
	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			api,
			localization,
			campaigns: []
		}
	},

	/**
	 * Called after the component instance is created.
	 */
	created() {
		// check if the user has logged in
		if (!api.loggedIn) return;
		
		api.campaigns.list()
		.then(campaigns => {
			this.campaigns = campaigns;
		})
		.catch(err => {
			Utils.Error('Cannot retrieve the campaigns', err);
		})
	},

	/**
	 * Methods for the Vue component.
	 */
	methods: {
		/**
		 * Deletes the given campaign.
		 * @param {string} campaignId
		 */
		deleteCampaign(campaignId) {
			if (confirm(localization.delete_campaign_msg)) {
				api.campaigns.delete(campaignId)
				.then(() => {
					this.campaigns = this.campaigns.filter(x => x.id != campaignId);
				})
				.catch(err => {
					Utils.Error('Cannot delete the campaign', err);
				})
			}
		}
	}
}
</script>

<style>
.red-color {
	color: red;
}

.progress {
  position: relative;
}

.progress-bar-title {
  position: absolute;
  text-align: center;
  line-height: 1rem;
  overflow: hidden;
  color: #000;
  right: 0;
  left: 0;
  top: 0;
}

</style>
