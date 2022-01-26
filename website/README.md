# Map My Mountains

Map My Mountains is a crowdsourcing web application where users improve the quality of mountain elements

## Build Setup
Copy `.env` to `.env.local` and update it to match your environment:
* `VUE_APP_API_ENDPOINT`: URL that points to the rest-api service.
* `VUE_APP_TERRAIN_PROVIDER`: URL that points to Cesium terrain server (optional).
* `VUE_APP_DEBUG_INFO`: set to true to display debug info in Map3D.
* `VUE_APP_CESIUM_ION_ACCESS_TOKEN`: token to use the Cesium ion API.

``` bash
# install project dependencies
npm install

# serve with hot reload at localhost:8080
npm run serve
```

## Production
To run the Map My Mountains website in production, use a web server such as Nginx.
``` bash
# install Nginx
sudo apt install nginx

# copy the default site
cd /etc/nginx/sites-available
sudo cp default mmm

# deactivate the default site and enable mmm
cd /etc/nginx/sites-enabled
sudo rm default
ln /etc/nginx/sites-available/mmm .
```

Edit the file `/etc/nginx/sites-available/mmm` to have these settings:
```
root /path/to/PeakLens-MapMyMountains/website/dist;
index index.html;
location / {
	try_files $uri $uri/ /index.html;
}
```

Finally:
``` bash
# build Map My Mountains for production with minification in ./dist/
cd /path/to/PeakLens-MapMyMountains/website
npm run build

# restart Nginx
sudo systemctl restart nginx
```

## Technical notes
* The app is developed following the guidelines of the [Vue.js](https://vuejs.org/) framework
* [Bootstrap + Vue](https://bootstrap-vue.js.org/) is used as library for components
* [Axios](https://github.com/axios/axios) is used for AJAX requests
* The Map2D component is based on [Leaflet](http://leafletjs.com/) and uses the tiles from the [OpenTopoMap](https://opentopomap.org) project
* The Map3D component is based on [Cesium](https://cesiumjs.org/) and uses aerial imagery from [Bing Maps](https://www.bing.com/maps/)

## Target browsers
Since Cesium requires [WebGL](https://en.wikipedia.org/wiki/WebGL), the supported browsers are:
* Mozilla Firefox
* Google Chrome
* Microsoft Internet Explorer 11
* Microsoft Edge
* Apple Safari

## Localization
The localized strings are stored in a TSV file `./localization/strings.tsv` which can be edited with a regular spreadsheet program.
Whenever the TSV file is modified, run the shell script `./localization/update.sh` to generate the file `./src/assets/loc_strings.js` used by the website.

How to add a new language:
1. Add a new column to the TSV file
2. Edit the file `src/assets/localization.js` to load the new language
3. Edit `src/App.vue` to allow the user to select the new language
