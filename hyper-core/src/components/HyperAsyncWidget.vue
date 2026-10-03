<template>
  <div class="hyper-async-widget">
    <!-- 1. 加载中骨架 -->
    <div v-if="isLoading" class="widget-loader">
      <div class="spinner"></div>
      <span>装载微模块 [{{ appId }}]...</span>
    </div>

    <!-- 2. 加载失败容灾 -->
    <div v-else-if="errorMessage" class="widget-error">
      <div class="error-banner">
        <span>⚠️ 模块加载异常: {{ errorMessage }}</span>
        <button class="retry-btn" @click="loadComponent">重试</button>
      </div>
    </div>

    <!-- 3. 正常渲染对等组件 -->
    <component
      :is="resolvedComponent"
      v-else
      v-bind="propsToChild"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onMounted } from 'vue';
import { hyperRemoteResolver } from '../utils/HyperRemoteResolver';

const props = defineProps<{
  appId: string;
  exposePath?: string;
  propsToChild?: Record<string, any>;
}>();

const resolvedComponent = shallowRef<any>(null);
const isLoading = ref(true);
const errorMessage = ref('');

async function loadComponent() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const comp = await hyperRemoteResolver.loadPeerModule(props.appId, props.exposePath);
    resolvedComponent.value = comp;
  } catch (err: any) {
    console.error(`[HyperAsyncWidget] Error loading ${props.appId}:`, err);
    errorMessage.value = err.message || '对等端模块拉取失败';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadComponent();

  // 监听版本热切换事件
  hyperRemoteResolver.onVersionChange((appId) => {
    if (hyperRemoteResolver.normalizeAppId(appId) === hyperRemoteResolver.normalizeAppId(props.appId)) {
      loadComponent();
    }
  });
});

watch(() => props.appId, () => {
  loadComponent();
});
</script>

<style scoped>
.hyper-async-widget {
  width: 100%;
  position: relative;
}
.widget-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 8px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  color: #94a3b8;
  font-size: 13px;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.widget-error {
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
}
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #f87171;
}
.retry-btn {
  padding: 4px 10px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
</style>
