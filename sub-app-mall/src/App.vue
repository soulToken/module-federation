<template>
  <div class="mall-app-view">
    <!-- 原生直接使用 Module Federation 导入的主应用公共组件 CommonNavbar -->
    <CommonNavbar
      title="微商城 (Sub-App Mall)"
      :sub-badge="isDetailPage ? '商品详情' : '独立路由:3001'"
      right-action-text="分享"
      @back="onNavbarBack"
      @right-click="onShare"
    />

    <div class="mall-body-wrapper">
      <!-- 🌟 根据子应用当前路由状态展示：列表页 vs 详情页 -->
      <transition name="fade-slide" mode="out-in">
        <MallDetail v-if="isDetailPage" />
        <MallList v-else />
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CommonNavbar from 'mainApp/CommonNavbar';
import { bridgeService, routeBridge } from 'mainApp/utils';
import MallList from './views/MallList.vue';
import MallDetail from './views/MallDetail.vue';

const route = useRoute();
const router = useRouter();

// 判断当前是否处于详情页
const isDetailPage = computed(() => {
  return route?.path?.includes('/detail') ?? false;
});

// 🌟 向全局路由桥接服务注册子应用路由感知与后退处理器
routeBridge.registerSubAppRoute('subMall', {
  name: 'subMall',
  backHandler: () => {
    if (isDetailPage.value) {
      // 内部多级子路由出栈：安全回退到商城列表根路径
      if (router) {
        router.push('/mall/list');
      } else {
        window.location.hash = '#/mall/list';
      }
      return true; // 声明：子应用内部成功处理后退
    }
    return false; // 声明：子应用已在首页，无法内部后退
  }
});

watch([isDetailPage, () => route?.path], ([detail, path]) => {
  routeBridge.updateSubAppRoute('subMall', path || '/mall/list', detail);
}, { immediate: true });

const onNavbarBack = () => {
  // 触发智能后退
  const handled = routeBridge.navigateBack();
  if (!handled) {
    // 如果子应用已经退无可退，且处于嵌入模式，通知主应用返回首页
    routeBridge.navigateTo('/home');
  }
};

const onShare = () => {
  bridgeService.callNativeShare({
    title: '微前端热卖商城好物推荐',
    desc: 'Module Federation 2.0 模块联邦 + 独立路由体验',
    link: window.location.href
  });
};
</script>

<style scoped>
.mall-app-view {
  min-height: 100%;
  background: #0b0f19;
  color: #e2e8f0;
}
.mall-body-wrapper {
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
