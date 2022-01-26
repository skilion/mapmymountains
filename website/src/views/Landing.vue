<!--
Landing page for a quick intro of MapMyMountains.
-->

<template>
<b-container class="mt-4">
	<b-row align-v="center" style="min-height:calc(100vh - 12rem)">
		<b-col xl="3" class="text-center">
			<h1>Map My Mountains</h1>
  			<p>{{localization.landing_help_build}}</p>
		</b-col>
		<b-col xl="9">
			<img src="../assets/screenshot.jpg" style="width:100%" class="shadow">
		</b-col>
	</b-row>
	<b-row align-v="center" style="height:8rem">
		<b-col>
			<h2 class="text-center">{{localization.landing_how_it_works}}</h2>
		</b-col>
	</b-row>
	<b-row style="margin-top:10rem">
		<b-col>
			<b-row align-v="center" style="height:4rem">
				<b-col>
					<h5 class="text-center">{{localization.landing_explore}}</h5>
				</b-col>
			</b-row>
			<b-row>
				<b-col md="4">
					<b-card class="my-3" :title="localization.landing_dolomites">
						<p class="card-text">{{localization.landing_dolomites_description}}</p>
					</b-card>
				</b-col>
				<b-col md="4">
					<b-card class="my-3" :title="localization.landing_bergamasque_alps">
						<p class="card-text">{{localization.landing_bergamasque_alps_description}}</p>
					</b-card>
				</b-col>
				<b-col md="4">
					<b-card class="my-3" :title="localization.landing_triangolo_lariano">
						<p class="card-text">{{localization.landing_triangolo_lariano_description}}</p>
					</b-card>
				</b-col>
			</b-row>
		</b-col>
	</b-row>
	<b-row style="margin-top:10rem">
		<b-col>
			<b-row align-v="center" style="height:4rem">
				<b-col>
					<h5 class="text-center">{{localization.landing_find_mountains}}</h5>
				</b-col>
			</b-row>
			<b-row>
				<b-col md="6">
					<video class="my-3 shadow" style="width:100%" loop autoplay>
  						<source src="../assets/demo_rotating.mp4" type="video/mp4">
					</video>
				</b-col>
				<b-col md="6">
					<video class="my-3 shadow" style="width:100%" loop autoplay>
  						<source src="../assets/demo_freemove.mp4" type="video/mp4">
					</video>
				</b-col>
			</b-row>
		</b-col>
	</b-row>
	<b-row style="margin-top:10rem">
		<b-col>
			<b-row align-v="center" style="height:4rem">
				<b-col class="text-center">
					<h5>{{localization.landing_map}}</h5>
				</b-col>
			</b-row>
			<b-row>
				<video class="my-3 mx-auto shadow" style="height:538px;min-width:10rem" loop autoplay>
					<source src="../assets/demo_annotation.mp4" type="video/mp4">
				</video>
			</b-row>
		</b-col>
	</b-row>
	<b-row>
		<b-col class="text-center h4" style="margin-top:10rem;margin-bottom:10rem">
			<b-link to="/login">
				{{localization.landing_register}}
			</b-link>
		</b-col>
	</b-row>
</b-container>
</template>

<script>
import localization from '@/assets/localization';

export default {
	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
			localization
		}
	},
}
</script>

<style>
.mmm-screenshot {
	width:100%;
	height:20rem;
	min-width:20rem;
	background-image: url('../assets/screenshot.jpg');
	background-repeat: no-repeat;
	background-size: contain;
}
</style>