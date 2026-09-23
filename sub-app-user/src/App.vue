<template>
  <div class="user-app-view">
    <!-- 原生直接使用 Module Federation 导入的主应用公共组件 CommonNavbar -->
    <CommonNavbar
      title="个人中心 (Sub-App User)"
      :sub-badge="isPointsPage ? '积分明细' : '独立路由:3003'"
      right-action-text="退出"
      @back="onNavbarBack"
      @right-click="onLogout"
    />

    <div class="user-body-wrapper">
      <!-- 🌟 根据子应用当前路由状态展示：主页 vs 积分详情页 -->
      <transition name="fade-slide" mode="out-in">
        <UserPoints v-if="isPointsPage" />
        <UserHome v-else />
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CommonNavbar from 'mainApp/CommonNavbar';
import { bridgeService, routeBridge } from 'mainApp/utils';
import UserHome from './views/UserHome.vue';
import UserPoints from './views/UserPoints.vue';

const route = useRoute();
const router = useRouter();

// 判断是否在积分明细二级页面
const isPointsPage = computed(() => {
  return route?.path?.includes('/points') ?? false;
});

// 🌟 向微前端路由桥接服务注册路由状态
routeBridge.registerSubAppRoute('subUser', {
  name: 'subUser',
  backHandler: () => {
    if (isPointsPage.value) {
      // 内部多级子路由出栈：安全回退到个人中心根路径
      if (router) {
        router.push('/user/home');
      } else {
        window.location.hash = '#/user/home';
      }
      return true;
    }
    return false;
  }
});

watch([isPointsPage, () => route?.path], ([points, path]) => {
  routeBridge.updateSubAppRoute('subUser', path || '/user/home', points);
}, { immediate: true });

const onNavbarBack = () => {
  const handled = routeBridge.navigateBack();
  if (!handled) {
    routeBridge.navigateTo('/home');
  }
};

const onLogout = () => {
  bridgeService.showToast('已安全退出登录', 'info');
};
</script>

<style scoped>
.user-app-view {
  min-height: 100%;
  background: #0b0f19;
  color: #e2e8f0;
}
.user-body-wrapper {
  overflow-y: auto;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(15px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}
</style>
