import { createRouter, createWebHashHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', name: 'Home', component: { template: '<div></div>' } },
    { path: '/mall', redirect: '/mall/list' },
    { path: '/mall/list', name: 'HostMallList', component: { template: '<div></div>' } },
    { path: '/mall/detail/:id', name: 'HostMallDetail', component: { template: '<div></div>' } },
    { path: '/activity', name: 'HostActivity', component: { template: '<div></div>' } },
    { path: '/user', redirect: '/user/home' },
    { path: '/user/home', name: 'HostUserHome', component: { template: '<div></div>' } },
    { path: '/user/points', name: 'HostUserPoints', component: { template: '<div></div>' } }
  ]
});
