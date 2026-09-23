import { createRouter, createWebHashHistory } from 'vue-router';
import { routeBridge } from 'mainApp/utils';
import MallList from '../views/MallList.vue';
import MallDetail from '../views/MallDetail.vue';

export const routes = [
  {
    path: '/',
    redirect: '/mall/list'
  },
  {
    path: '/mall/list',
    name: 'MallList',
    component: MallList
  },
  {
    path: '/mall/detail/:id',
    name: 'MallDetail',
    component: MallDetail
  },
  // 兼容直接访问 /detail/:id
  {
    path: '/detail/:id',
    redirect: (to: any) => `/mall/detail/${to.params.id}`
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 🌟 子应用内部路由变化时，同步状态给微前端路由桥接服务
router.afterEach((to) => {
  const isAtSubAppRoot = to.path === '/mall/list' || to.path === '/';
  routeBridge.updateSubAppRoute('subMall', to.path, !isAtSubAppRoot);
});

// 🌟 注册子应用的智能后退消费器
routeBridge.registerSubAppRoute('subMall', {
  name: 'subMall',
  currentPath: '/mall/list',
  canGoBack: false,
  backHandler: () => {
    const currentPath = router.currentRoute.value.path;
    if (currentPath !== '/mall/list' && currentPath !== '/') {
      // 子应用处于详情页：内部回退到列表页
      router.push('/mall/list');
      return true; // 声明子应用内部已成功消费后退
    }
    // 已在商城首页，无法再退，返回 false 交由主应用退回门户首页
    return false;
  }
});
