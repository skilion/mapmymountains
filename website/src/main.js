import App from '@/App.vue';
import BootstrapVue from 'bootstrap-vue';
import Highcharts from 'highcharts';
import Toasted from 'vue-toasted';
import Vue from 'vue';
import VueHighcharts from 'vue-highcharts';
import router from './router';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

///////////////////////////////////////////////////////////////////////////////
// Font Awesome

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faCaretLeft,
  faCaretRight,
  faChevronDown,
  faChevronRight,
  faClipboard,
  faEnvelope,
  faFrown,
  faLanguage,
  faQuestion,
  faShareAlt,
  faSmile,
  faSpinner,
  faUser
} from '@fortawesome/free-solid-svg-icons';

library.add(faArrowLeft, faArrowRight);
library.add(faCaretLeft, faCaretRight);
library.add(faChevronDown, faChevronRight);
library.add(faClipboard);
library.add(faEnvelope);
library.add(faLanguage);
library.add(faQuestion);
library.add(faSmile, faFrown);
library.add(faShareAlt);
library.add(faSpinner);
library.add(faUser);

Vue.component('font-awesome-icon', FontAwesomeIcon);

///////////////////////////////////////////////////////////////////////////////

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(Toasted);
Vue.use(VueHighcharts, { Highcharts });

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
