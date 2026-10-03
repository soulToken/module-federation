<template>
  <div class="mall-app-view">
    <CommonNavbar
      title="微商城 (hyper-mall)"
      :sub-badge="isDetailPage ? '商品详情' : '独立对等应用:3001'"
      right-action-text="分享"
      @back="onNavbarBack"
      @right-click="onShare"
    />

    <div class="mall-body-wrapper">
      <transition name="fade-slide" mode="out-in">
        <MallDetail v-if="isDetailPage" />
        <MallList v-else />
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
import MallList from './views/MallList.vue';
import MallDetail from './views/MallDetail.vue';

const route = useRoute();
const router = useRouter();

const isDetailPage = computed(() => {
  return route?.path?.includes('/detail') ?? false;
});

const onNavbarBack = () => {
  if (isDetailPage.value) {
    if (router) {
      router.push('/mall/list');
    } else {
      window.location.hash = '#/mall/list';
    }
  } else if (window.history.length > 1) {
    window.history.back();
  } else {
    bridgeService.showToast('已处于商城首页', 'info');
  }
};

const onShare = () => {
  bridgeService.callNativeShare({
    title: 'hyper-mall 微商城对等应用',
    desc: 'Module Federation 2.0 去中心化微前端架构体验',
    link: window.location.href,
  });
};
</script>

<style scoped>
.mall-app-view {
  min-height: 100vh;
  background: #0b0f19;
  color: #e2e8f0;
}
.mall-body-wrapper {
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
