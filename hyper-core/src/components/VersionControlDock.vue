<template>
  <div class="version-dock-container">
    <!-- 悬浮调控按钮 -->
    <button class="dock-toggle-btn" @click="isOpen = !isOpen" title="模块联邦去中心化版本与 A/B 测试控制台">
      <span class="dock-icon">⚙️</span>
      <span class="dock-text">hyper 实验中心</span>
      <span v-if="hasActiveOverrides" class="dock-dot"></span>
    </button>

    <!-- 弹出的交互面板 -->
    <div v-if="isOpen" class="dock-panel">
      <div class="dock-header">
        <div class="dock-title">
          <span class="title-badge">Peer-to-Peer</span>
          <h3>去中心化版本与 A/B 实验控制台</h3>
        </div>
        <button class="close-btn" @click="isOpen = false">✕</button>
      </div>

      <div class="dock-content">
        <!-- 访客身份与一致性 Hash 种子卡片 -->
        <div class="dock-card visitor-card">
          <div class="card-header">
            <span>👤 设备访客标识 (Visitor ID)</span>
            <button class="action-btn-sm" @click="onResetVisitorId">🎲 重新摇号</button>
          </div>
          <div class="visitor-id-val">{{ visitorId }}</div>
          <small class="tip">注：一致性 Hash 以此 ID 为确定性种子进行 0..99 分流</small>
        </div>

        <!-- 对等微应用版本与 A/B 实验调控列表 -->
        <div class="apps-list">
          <div v-for="(app, appId) in manifest.apps" :key="appId" class="app-card">
            <div class="app-info">
              <span class="app-icon">{{ app.icon || '📦' }}</span>
              <div class="app-name-box">
                <strong>{{ app.name }}</strong>
                <span class="app-id">ID: {{ appId }}</span>
              </div>
              <span :class="['version-badge', currentActiveVer(appId) === 'v1.1.0' ? 'badge-green' : 'badge-gray']">
                {{ currentActiveVer(appId) }}
              </span>
            </div>

            <!-- 版本快速切换操作行 -->
            <div class="control-row">
              <span class="row-label">物理版本切流:</span>
              <div class="btn-group">
                <button
                  v-for="(verMeta, verKey) in app.versions"
                  :key="verKey"
                  :class="['ver-btn', currentActiveVer(appId) === verKey ? 'active' : '']"
                  @click="onSwitchVersion(appId, verKey)"
                >
                  {{ verKey }} ({{ verMeta.tag || '版本' }})
                </button>
              </div>
            </div>

            <!-- A/B 实验组锁定操作行 -->
            <div v-if="manifest.experiments && manifest.experiments[appId]" class="control-row">
              <span class="row-label">A/B 分流实验:</span>
              <div class="btn-group">
                <button
                  :class="['ab-btn', currentAbOverride(appId) === undefined ? 'active-auto' : '']"
                  @click="onSetAbGroup(appId, 'AUTO')"
                >
                  ⚡ 自然分流 (Auto)
                </button>
                <button
                  :class="['ab-btn', currentAbOverride(appId) === 'A' ? 'active-a' : '']"
                  @click="onSetAbGroup(appId, 'A')"
                >
                  🔒 锁定 A 组
                </button>
                <button
                  :class="['ab-btn', currentAbOverride(appId) === 'B' ? 'active-b' : '']"
                  @click="onSetAbGroup(appId, 'B')"
                >
                  🔒 锁定 B 组
                </button>
              </div>
            </div>

            <div v-if="getEvalResult(appId).inExperiment" class="eval-status">
              <span>🎯 实时分流命中: <strong>[{{ getEvalResult(appId).group }}组] {{ getEvalResult(appId).groupName }}</strong></span>
              <span>(Hash 分值: {{ getEvalResult(appId).score }})</span>
            </div>
          </div>
        </div>

        <!-- 曝光流水 -->
        <div class="dock-card">
          <div class="card-header">
            <span>📡 实时实验曝光上报流水 (Live Exposures)</span>
          </div>
          <div class="exposure-list">
            <div v-for="(log, i) in exposureLogs" :key="i" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-app">{{ log.appId }}</span>
              <span class="log-group">[{{ log.group }}组]</span>
              <span class="log-ver">{{ log.version }}</span>
            </div>
            <div v-if="exposureLogs.length === 0" class="empty-log">暂无曝光记录</div>
          </div>
        </div>

        <div class="dock-actions">
          <button class="reset-all-btn" @click="onResetAll">🔄 清除所有本地覆写并恢复默认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { hyperRemoteResolver } from '../utils/HyperRemoteResolver';

const isOpen = ref(false);

const manifest = computed(() => hyperRemoteResolver.registry.value);
const visitorId = computed(() => hyperRemoteResolver.visitorId.value);
const exposureLogs = computed(() => hyperRemoteResolver.exposureLogs.value);

const hasActiveOverrides = computed(() => {
  return (
    Object.keys(hyperRemoteResolver.overrides.value).length > 0 ||
    Object.keys(hyperRemoteResolver.abOverrides.value).length > 0
  );
});

function currentActiveVer(appId: string) {
  return hyperRemoteResolver.resolveTargetVersion(appId);
}

function currentAbOverride(appId: string) {
  return hyperRemoteResolver.abOverrides.value[appId];
}

function getEvalResult(appId: string) {
  return hyperRemoteResolver.evaluateExperiment(appId);
}

function onSwitchVersion(appId: string, version: string) {
  hyperRemoteResolver.switchVersion(appId, version);
}

function onSetAbGroup(appId: string, group: string) {
  hyperRemoteResolver.setAbOverride(appId, group);
}

function onResetVisitorId() {
  hyperRemoteResolver.resetVisitorId();
}

function onResetAll() {
  hyperRemoteResolver.resetOverrides();
}
</script>

<style scoped>
.version-dock-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.dock-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #0ea5e9, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 9999px;
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.4);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.dock-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(14, 165, 233, 0.6);
}
.dock-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f59e0b;
  border: 2px solid #fff;
}
.dock-panel {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.title-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #0ea5e9;
  border-radius: 4px;
  font-weight: bold;
}
.dock-header h3 {
  font-size: 14px;
  margin: 4px 0 0 0;
  font-weight: 600;
}
.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}
.dock-content {
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dock-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #cbd5e1;
  margin-bottom: 6px;
}
.action-btn-sm {
  padding: 2px 8px;
  font-size: 11px;
  background: #334155;
  color: #38bdf8;
  border: 1px solid #475569;
  border-radius: 4px;
  cursor: pointer;
}
.visitor-id-val {
  font-family: monospace;
  font-size: 13px;
  color: #38bdf8;
  background: #1e293b;
  padding: 6px;
  border-radius: 4px;
}
.tip {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  display: block;
}
.apps-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.app-card {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px;
}
.app-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.app-icon {
  font-size: 20px;
}
.app-name-box {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.app-name-box strong {
  font-size: 13px;
}
.app-id {
  font-size: 11px;
  color: #64748b;
}
.version-badge {
  font-size: 11px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 9999px;
}
.badge-green {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid #10b981;
}
.badge-gray {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  border: 1px solid #64748b;
}
.control-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}
.row-label {
  font-size: 11px;
  color: #94a3b8;
}
.btn-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ver-btn, .ab-btn {
  padding: 4px 8px;
  font-size: 11px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.ver-btn.active {
  background: #0ea5e9;
  color: #fff;
  border-color: #38bdf8;
}
.ab-btn.active-auto {
  background: #8b5cf6;
  color: #fff;
}
.ab-btn.active-a {
  background: #64748b;
  color: #fff;
}
.ab-btn.active-b {
  background: #10b981;
  color: #fff;
}
.eval-status {
  margin-top: 8px;
  font-size: 11px;
  color: #38bdf8;
  display: flex;
  justify-content: space-between;
  background: rgba(14, 165, 233, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}
.exposure-list {
  max-height: 90px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.log-item {
  font-size: 11px;
  font-family: monospace;
  display: flex;
  gap: 6px;
  color: #94a3b8;
}
.log-group {
  color: #34d399;
}
.empty-log {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  padding: 8px;
}
.dock-actions {
  display: flex;
  justify-content: center;
}
.reset-all-btn {
  width: 100%;
  padding: 8px;
  background: #334155;
  border: none;
  border-radius: 6px;
  color: #f1f5f9;
  font-size: 12px;
  cursor: pointer;
}
.reset-all-btn:hover {
  background: #475569;
}
</style>
