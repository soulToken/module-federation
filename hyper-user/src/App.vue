<template>
  <div class="user-app-view">
    <CommonNavbar
      title="个人中心 (hyper-user)"
      :sub-badge="isPointsPage ? '积分明细' : '独立对等应用:3003'"
      right-action-text="退出"
      @back="onNavbarBack"
      @right-click="onLogout"
    />

    <div class="user-body-wrapper">
      <transition name="fade-slide" mode="out-in">
        <UserPoints v-if="isPointsPage" />
        <UserHome v-else />
      </transition>
    </div>

    <!-- 去中心化版本控制与 A/B 实验调控悬浮中心 -->
    <VersionControlDock />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CommonNavbar, VersionControlDock, bridgeService } from '@hyper/core';
import UserHome from './views/UserHome.vue';
import UserPoints from './views/UserPoints.vue';

const route = useRoute();
const router = useRouter();

const isPointsPage = computed(() => {
  return route?.path?.includes('/points') ?? false;
});

const onNavbarBack = () => {
  if (isPointsPage.value) {
    if (router) {
      router.push('/user/home');
    } else {
      window.location.hash = '#/user/home';
    }
  } else if (window.history.length > 1) {
    window.history.back();
  } else {
    bridgeService.showToast('已处于个人中心首页', 'info');
  }
};

const onLogout = () => {
  bridgeService.showToast('已安全退出登录', 'info');
};
</script>

<style scoped>
.user-app-view {
  min-height: 100vh;
  background: #0b0f19;
  color: #e2e8f0;
}
.user-body-wrapper {
  overflow-y: auto;
  padding-bottom: 60px;
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
