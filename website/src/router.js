import Vue from 'vue';
import Router from 'vue-router';

import AnnotationList from '@/views/AnnotationList';
import Annotator from '@/views/Annotator';
import Campaigns from '@/views/Campaigns';
import CreateCampaign from '@/views/CreateCampaign';
import Explore from '@/views/Explore';
import Landing from '@/views/Landing';
import Login from '@/views/Login';
import PasswordReset from '@/views/PasswordReset';
import PeakSourcesList from '@/views/PeakSourcesList';
import Peaks from '@/views/Peaks';
import QuickView from '@/views/QuickView';
import QuickRegister from '@/views/QuickRegister';
import Register from '@/views/Register';
import Statistics from '@/views/Statistics';
import User from '@/views/User';
import UserList from '@/views/UserList';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
	{
		path: '/',
		component: Landing
	},
	{
		path: '/annotator',
		component: Annotator
	},
	{
		path: '/annotations',
		component: AnnotationList
	},
	{
		path: '/campaigns',
		component: Campaigns
	},
	{
		path: '/create_campaign',
		component: CreateCampaign
	},
	{
		path: '/explore',
		component: Explore
	},
	{
		path: '/login',
		component: Login
	},
	{
		path: '/password_reset',
		component: PasswordReset
	},
	{
		path: '/peaks',
		component: Peaks
	},
	{
		path: '/quick',
		component: QuickView
	},
	{
		path: '/quick_register',
		component: QuickRegister
	},
	{
		path: '/register',
		component: Register
	},
	{
		path: '/sources',
		component: PeakSourcesList
	},
	{
		path: '/stats',
		component: Statistics
	},
	{
		path: '/user',
		component: User
	},
	{
		path: '/user_list',
		component: UserList
	}
  ]
});
