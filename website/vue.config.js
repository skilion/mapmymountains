const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const cesiumSource = 'node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';

module.exports = {
	configureWebpack: {
		plugins: [
			// copy Assets, Widgets, and Workers to a static directory
			new CopyWebpackPlugin([{from: path.join(cesiumSource, cesiumWorkers), to: 'Workers'}]),
			new CopyWebpackPlugin([{from: path.join(cesiumSource, 'Assets'), to: 'Assets'}]),
			new CopyWebpackPlugin([{from: path.join(cesiumSource, 'Widgets'), to: 'Widgets'}]),
			// define relative base path in cesium for loading assets
			new webpack.DefinePlugin({CESIUM_BASE_URL: JSON.stringify('/')})
		],
		resolve: {
			alias: {
				// cesium module name
				'Cesium': path.resolve(__dirname, cesiumSource),
				'cesium': path.resolve(__dirname, cesiumSource + '/Cesium.js'),
				'cesium-navigation': path.resolve(__dirname, 'node_modules/cesium-navigation/Source/viewerCesiumNavigationMixin.js')
			}
		},
		devtool: 'source-map'
	},
	devServer: {
		host: 'localhost'
	}
}
