<!--
Landing page for a quick intro of MapMyMountains.
-->

<template>
<b-container class="mt-4">
	<b-row align-v="center" style="min-height:calc(100vh - 12rem)">
		<b-col xl="3" class="text-center">
			<h1>Map My Mountains</h1>
  			<p>Aiuta a costruire un database di montagne libero, per tutti.</p>
		</b-col>
		<b-col xl="9">
			<img src="../assets/screenshot.jpg" style="width:100%" class="shadow">
		</b-col>
	</b-row>
	<b-row align-v="center" style="height:8rem">
		<b-col>
			<h2 class="text-center">Come funziona?</h2>
		</b-col>
	</b-row>
	<b-row style="margin-top:10rem">
		<b-col>
			<b-row align-v="center" style="height:4rem">
				<b-col>
					<h5 class="text-center">Esplora le aree che conosci.</h5>
				</b-col>
			</b-row>
			<b-row>
				<b-col md="4">
					<b-card class="my-3" title="Dolomiti">
						<p class="card-text">Le Dolomiti, anche dette Monti pallidi (Dolomiten in tedesco, Dolomites in ladino, Dolomitis in friulano), sono un insieme di gruppi montuosi delle Alpi Orientali italiane, a sud della catena principale alpina, comprese tra Veneto, Trentino-Alto Adige e Friuli, tra le province di Belluno, Bolzano, Trento, Udine e Pordenone.</p>
					</b-card>
				</b-col>
				<b-col md="4">
					<b-card class="my-3" title="Alpi Orobie">
						<p class="card-text">Le Alpi Orobie (o, più semplicemente Orobie) sono una sottosezione delle Alpi e Prealpi Bergamasche. Limitate a nord dalla sponda meridionale della Valtellina inferiore che dal passo dell'Aprica si spinge in direzione ovest sino all'insenatura di Piona, all'estremità settentrionale del lago di Como.</p>
					</b-card>
				</b-col>
				<b-col md="4">
					<b-card class="my-3" title="Triangolo Lariano">
						<p class="card-text">Il Triangolo Lariano o Penisola Lariana è la parte di terra compresa fra i due rami del Lago di Como, detto anche "Lario". Occupato da rilievi montuosi prealpini, che culminano col Monte San Primo (1.686 metri), è tagliato in senso verticale dal solco della Valassina (o Vallassina), entro cui scorre il primo tratto del fiume Lambro.</p>
					</b-card>
				</b-col>
			</b-row>
		</b-col>
	</b-row>
	<b-row style="margin-top:10rem">
		<b-col>
			<b-row align-v="center" style="height:4rem">
				<b-col>
					<h5 class="text-center">Trova le montagne che ami.</h5>
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
					<h5>Mappa le montagne!</h5>
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
			<b-link to="/register">
				Registrati e inizia a mappare!
			</b-link>
		</b-col>
	</b-row>
</b-container>
</template>

<script>
export default {
	/**
	 * Data object for the Vue instance.
	 */
	data() {
		return {
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