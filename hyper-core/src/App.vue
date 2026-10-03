<template>
  <div class="core-app-view">
    <CommonNavbar
      title="hyper-core 共享核心应用"
      sub-badge="独立服务:3000"
      right-action-text="Toast"
      @back="onBack"
      @right-click="testToast"
    />

    <div class="core-content">
      <div class="intro-card">
        <h3>🧩 hyper-core 独立微前端服务</h3>
        <p>
          本应用是一个<strong>完全独立部署的模块联邦应用 (Port: 3000)</strong>。
          通过 <code>remoteEntry.js</code> 对外暴露公共原子 UI 组件与运行时解析服务，供 <code>hyper-mall</code>、<code>hyper-activity</code>、<code>hyper-user</code> 动态消费。
        </p>
      </div>

      <div class="section-card">
        <h4>对外暴露的基础 UI 组件展示 (Exposes)</h4>
        <div class="btn-demo-row">
          <CommonButton type="primary" size="medium" @click="testToast">主要按钮</CommonButton>
          <CommonButton type="warning" size="medium" @click="modalVisible = true">打开模态窗</CommonButton>
          <CommonButton type="default" size="medium" @click="testShare">触发 JSBridge 分享</CommonButton>
        </div>
      </div>

      <div class="section-card">
        <h4>当前全局认证与状态 (Auth Service)</h4>
        <div class="status-grid">
          <div>用户: <strong>{{ user.nickname }}</strong></div>
          <div>权限: <span class="tag">{{ user.role }}</span></div>
          <div>积分: <strong class="points">{{ points }}</strong></div>
        </div>
      </div>
    </div>

    <CommonModal
      v-model:visible="modalVisible"
      title="hyper-core 公共模态弹窗"
      confirm-text="确定"
      @confirm="modalVisible = false"
    >
      <p style="font-size: 13px; color: #cbd5e1;">这是由 hyper-core 独立暴露给所有对等微应用的通用模态窗组件。</p>
    </CommonModal>

    <!-- 实验与调控悬浮中心 -->
    <VersionControlDock />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CommonNavbar from './components/CommonNavbar.vue';
import CommonButton from './components/CommonButton.vue';
import CommonModal from './components/CommonModal.vue';
import VersionControlDock from './components/VersionControlDock.vue';
import { authService, bridgeService, hyperEventBus } from './index';

const user = ref(authService.getUserInfo());
const points = ref(user.value.points);
const modalVisible = ref(false);

hyperEventBus.on('points:update', (delta: number) => {
  points.value += delta;
});

function onBack() {
  bridgeService.showToast('已处于 hyper-core 首页', 'info');
}

function testToast() {
  bridgeService.showToast('这是来自 hyper-core 的 Toast 通知', 'success');
  bridgeService.vibrate();
}

function testShare() {
  bridgeService.callNativeShare({
    title: 'hyper-core 独立微前端核心服务',
    desc: '独立仓库、独立部署、去中心化共享',
    link: window.location.href,
  });
}
</script>

<style scoped>
.core-app-view {
  min-height: 100vh;
  background: #0b0f19;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.core-content {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}
.intro-card {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.intro-card h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #38bdf8;
}
.intro-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #94a3b8;
}
.section-card {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.section-card h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #f1f5f9;
}
.btn-demo-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.status-grid {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #cbd5e1;
}
.tag {
  background: #f59e0b;
  color: #000;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.points {
  color: #38bdf8;
}
</style>
