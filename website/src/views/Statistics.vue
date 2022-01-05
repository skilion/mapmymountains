<!--
This view shows statistics about MapMyMountains.
-->

<template>
<b-container>
	<b-row class="my-3">
		<b-col>
			<h1>{{localization.statistics}}</h1>
		</b-col>
	</b-row>
	<b-row class="mb-3">
		<b-col>
			<highcharts :options="topAnnotatorsOptions"></highcharts>
		</b-col>
		<b-col>
			<highcharts :options="topCampaignsOptions"></highcharts>
		</b-col>
	</b-row>
	<b-row>
		<b-col>
			<highcharts :options="dailyAnnotationsOptions"></highcharts>
		</b-col>
	</b-row>
</b-container>
</template>

<script>
import api from '@/assets/api';
import localization from '@/assets/localization';
import * as Utils from '@/components/Utils';

export default {
	created: function () {
		api.stats.get()
		.then(stats => {
			this.top_annotators = stats.top_annotators;
			this.top_campaigns = stats.top_campaigns;
			this.daily_annotations = stats.daily_annotations;
		})
		.catch(err => {
			Utils.Error('Cannot get the statistics', err);
		})
	},
	computed: {
		topAnnotatorsOptions: function () {
			return {
				chart: {
					type: 'bar'
				},
				title: {
					text: localization.top_annotators
				},
				xAxis: {
					categories: this.top_annotators.map(item => item.user_id),
					title: {
						text: localization.user
					},
				},
				yAxis: {
					title: {
						text: localization.num_of_annotations
					}
				},
				legend: {
					enabled: false
				},
				tooltip: {
					formatter: function() {
						return `${this.x}: ${this.y}`;
					}
				},
				series: [{
					data: this.top_annotators.map(item => item.num_annotations)
				}]
			}
		},
		topCampaignsOptions: function () {
			return {
				chart: {
					type: 'bar'
				},
				title: {
					text: localization.top_campaigns
				},
				xAxis: {
					categories: this.top_campaigns.map(item => item.name),
					title: {
						text: localization.campaign
					},
				},
				yAxis: {
					title: {
						text: localization.num_of_annotations
					}
				},
				legend: {
					enabled: false
				},
				tooltip: {
					formatter: function() {
						return `${this.x}: ${this.y}`;
					}
				},
				series: [{
					data: this.top_campaigns.map(item => item.num_annotations)
				}]
			}
		},
		dailyAnnotationsOptions: function () {
			return {
				title: {
					text: localization.annotations
				},
				xAxis: {
					type: 'datetime'
				},
				yAxis: {
					title: {
						text: localization.num_of_annotations
					}
				},
				legend: {
					enabled: false
				},
				tooltip: {
					formatter: function() {
						return `${new Date(this.x).toLocaleDateString(localization.getLanguage())}<br>${this.y}`;
					}
				},
				series: [{
					data: this.daily_annotations.map(item => [
						Date.parse(item.date),
						item.num_annotations
					])
				}]
			}
		}
	},
	data: function () {
		return {
			localization,
			top_annotators: [],
			top_campaigns: [],
			daily_annotations: []
		}
	}
}
</script>

<style>
</style>
