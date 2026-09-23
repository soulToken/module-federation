import { createRouter, createWebHashHistory } from 'vue-router';
import { routeBridge } from 'mainApp/utils';
import UserHome from '../views/UserHome.vue';
import UserPoints from '../views/UserPoints.vue';

export const routes = [
  {
    path: '/',
    redirect: '/user/home'
  },
  {
    path: '/user/home',
    name: 'UserHome',
    component: UserHome
  },
  {
    path: '/user/points',
    name: 'UserPoints',
    component: UserPoints
  },
  // 兼容 /points
  {
    path: '/points',
    redirect: '/user/points'
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 🌟 子应用内部路由变化时，同步状态给微前端路由桥接服务
router.afterEach((to) => {
  const isAtSubAppRoot = to.path === '/user/home' || to.path === '/';
  routeBridge.updateSubAppRoute('subUser', to.path, !isAtSubAppRoot);
});

// 🌟 注册子应用的智能后退消费器
routeBridge.registerSubAppRoute('subUser', {
  name: 'subUser',
  currentPath: '/user/home',
  canGoBack: false,
  backHandler: () => {
    const currentPath = router.currentRoute.value.path;
    if (currentPath !== '/user/home' && currentPath !== '/') {
      // 处于积分明细子页面：内部回退到个人中心首页
      router.push('/user/home');
      return true; // 声明子应用内部已成功消费后退
    }
    // 已在个人中心首页，无法再退，交由主应用退回门户首页
    return false;
  }
});
