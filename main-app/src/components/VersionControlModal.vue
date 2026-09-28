<template>
  <div v-if="visible" class="version-modal-mask" @click.self="$emit('update:visible', false)">
    <div class="version-modal-card">
      <!-- 弹窗顶栏 -->
      <div class="modal-header">
        <div class="title-wrap">
          <div class="header-icon">🏷️</div>
          <div>
            <h3>微前端多版本控制与 A/B 实验中心</h3>
            <p class="sub-desc">基于 Manifest 动态编排 · 零构建秒级回滚 · 确定性 Hash 流量分流</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('update:visible', false)">✕</button>
      </div>

      <!-- 功能选项卡导航 -->
      <div class="modal-tab-bar">
        <button
          class="modal-tab-btn"
          :class="{ 'is-active': activeTab === 'versions' }"
          @click="activeTab = 'versions'"
        >
          🏷️ 多版本与一键回滚
        </button>
        <button
          class="modal-tab-btn"
          :class="{ 'is-active': activeTab === 'abtest' }"
          @click="activeTab = 'abtest'"
        >
          🧪 A/B 实验与流量分流
          <span class="tab-badge-pulse" v-if="hasActiveExperiments">RUNNING</span>
        </button>
      </div>

      <!-- 快速统计与状态栏 -->
      <div class="manifest-status-bar">
        <div class="status-col">
          <span class="status-label">Manifest 更新时间:</span>
          <span class="status-val">{{ formatTime(manifest.updatedAt) }}</span>
        </div>
        <div class="status-col">
          <span class="status-label">当前访客 ID:</span>
          <code class="visitor-code">{{ currentVisitorId }}</code>
          <button class="mini-btn" @click="handleRerollVisitor" title="重新随机生成设备 ID，模拟全新访客进站分流">
            🎲 重新摇号
          </button>
        </div>
        <div class="status-col">
          <button class="reset-all-btn" @click="handleResetAll">
            🔄 恢复线上默认状态
          </button>
        </div>
      </div>

      <!-- TAB 1: 多版本列表与一键回滚 -->
      <div v-if="activeTab === 'versions'" class="app-version-scroll">
        <div
          v-for="(app, appId) in manifest.apps"
          :key="appId"
          class="app-card"
        >
          <!-- 子应用头部信息 -->
          <div class="app-header">
            <div class="app-title-box">
              <span class="app-icon">{{ app.icon }}</span>
              <div>
                <h4>{{ app.name }}</h4>
                <span class="app-id">ID: {{ appId }} · 模块名: {{ app.moduleName }}</span>
              </div>
            </div>

            <!-- 当前运行状态徽章 -->
            <div class="current-badge-box">
              <span class="active-badge">
                当前运行: <strong>{{ versionManager.getActiveVersion(appId as string) }}</strong>
              </span>
              <span v-if="versionManager.isOverridden(appId as string)" class="override-tag">
                ⚠️ 本地已覆写/锁定
              </span>
            </div>
          </div>

          <!-- 该应用的各版本选择列表 -->
          <div class="version-list-grid">
            <div
              v-for="(ver, verKey) in app.versions"
              :key="verKey"
              class="version-card"
              :class="{
                'is-active': versionManager.getActiveVersion(appId as string) === ver.version,
                'is-manifest-default': manifest.activeVersions[appId] === ver.version
              }"
            >
              <div class="ver-top-row">
                <div class="ver-name-group">
                  <span class="ver-num">{{ ver.version }}</span>
                  <span :class="['tag-pill', `tag-${ver.badgeColor || 'gray'}`]">{{ ver.tag }}</span>
                  <span v-if="manifest.activeVersions[appId] === ver.version" class="default-badge">线上默认</span>
                </div>
                <span class="ver-time">{{ ver.releasedAt }}</span>
              </div>

              <p class="ver-desc">{{ ver.description }}</p>

              <div class="ver-footer-row">
                <span class="ver-entry-path">Entry: {{ ver.entry }}</span>
                <div class="ver-actions">
                  <button
                    v-if="versionManager.getActiveVersion(appId as string) === ver.version"
                    class="btn-current"
                    disabled
                  >
                    ● 正在运行
                  </button>
                  <button
                    v-else
                    :class="['btn-switch', isRollback(appId as string, ver.version) ? 'btn-rollback' : 'btn-upgrade']"
                    @click="handleSelectVersion(appId as string, ver.version, ver.tag)"
                  >
                    {{ isRollback(appId as string, ver.version) ? '⏪ 一键回滚至此版本' : '🚀 切换至此版本' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: A/B 实验与金丝雀分流中心 -->
      <div v-else class="app-version-scroll ab-test-scroll">
        <!-- 访客设备与算法说明 -->
        <div class="ab-intro-banner">
          <div class="intro-icon">🧬</div>
          <div class="intro-body">
            <div class="intro-title">确定性一致性 Hash 流量分流引擎 (Consistent Hash Bucketing)</div>
            <p class="intro-desc">
              根据访客唯一设备标识 (<code>{{ currentVisitorId }}</code>) 与实验 ID 进行正交哈希运算（0~99 分位）。同一访客多次访问将永久稳定锁定在指定实验组，保证用户体验一致性与指标严谨度。
            </p>
          </div>
          <button class="reroll-action-btn" @click="handleRerollVisitor">
            🎲 模拟新访客重新摇号
          </button>
        </div>

        <!-- 各应用 A/B 实验卡片 -->
        <div
          v-for="(exp, appId) in experimentsList"
          :key="appId"
          class="ab-experiment-card"
        >
          <!-- 实验卡片头部 -->
          <div class="exp-card-header">
            <div class="exp-title-box">
              <span class="app-icon">{{ getAppIcon(appId) }}</span>
              <div>
                <div class="exp-header-top">
                  <h4>{{ exp.name }}</h4>
                  <span :class="['exp-status-chip', exp.enabled ? 'chip-running' : 'chip-paused']">
                    {{ exp.enabled ? '🟢 实验运行中' : '⚪ 实验已暂停' }}
                  </span>
                </div>
                <span class="exp-metric-tag">🎯 核心指标：{{ exp.metric || '综合转化率' }}</span>
              </div>
            </div>

            <!-- 实验开关按钮 -->
            <button
              class="toggle-exp-btn"
              :class="{ 'btn-on': exp.enabled }"
              @click="toggleExp(appId)"
            >
              {{ exp.enabled ? '暂停该实验' : '启用该实验' }}
            </button>
          </div>

          <p class="exp-desc-text">{{ exp.description }}</p>

          <!-- 本机分流结果指示牌 -->
          <div class="user-bucket-status-panel">
            <div class="bucket-status-left">
              <span class="panel-label">本机当前分流结果</span>
              <div v-if="exp.enabled" class="bucket-result-box">
                <span class="bucket-group-tag" :style="{ backgroundColor: getBucketColor(appId) }">
                  分组 {{ getExpResult(appId).group }}
                </span>
                <strong class="bucket-result-name">{{ getExpResult(appId).groupName }}</strong>
                <span class="bucket-version-pill">版本: {{ getExpResult(appId).version }}</span>
                <span v-if="getExpResult(appId).isManualOverride" class="override-warn-chip">
                  ⚠️ 人工强制锁定
                </span>
                <span v-else class="hash-score-chip">
                  Hash分值: {{ getExpResult(appId).hashScore }} / 100
                </span>
              </div>
              <div v-else class="bucket-disabled-text">
                ⚪ 实验未开启，全网生效 Manifest 统一默认版本 ({{ manifest.activeVersions[appId] }})
              </div>
            </div>

            <!-- 分组快速锁定与测试按钮 -->
            <div class="ab-quick-switch-actions">
              <span class="quick-label">人工锁定调试:</span>
              <button
                v-for="b in exp.buckets"
                :key="b.group"
                class="ab-group-btn"
                :class="{ 'is-selected': getExpResult(appId).group === b.group && getExpResult(appId).isManualOverride }"
                @click="handleForceAbGroup(appId, b.group)"
              >
                锁定 {{ b.group }} 组 ({{ b.version }})
              </button>
              <button
                class="ab-auto-btn"
                :class="{ 'is-active': !getExpResult(appId).isManualOverride }"
                @click="handleForceAbGroup(appId, 'AUTO')"
                title="清除人工指定，恢复依据设备 Hash 自动分流"
              >
                ⚡ 自然分流
              </button>
            </div>
          </div>

          <!-- 流量比例可视化分布条 -->
          <div class="traffic-slider-container">
            <div class="traffic-bar-header">
              <span class="traffic-title">📊 流量分配比例与版本对照</span>
              <span class="traffic-detail-text">
                {{ formatBucketRatio(exp.buckets) }}
              </span>
            </div>

            <!-- 彩色分流进度条 -->
            <div class="traffic-ratio-bar">
              <div
                v-for="b in exp.buckets"
                :key="b.group"
                class="ratio-segment"
                :style="{
                  width: b.weight + '%',
                  backgroundColor: b.color || '#3b82f6'
                }"
              >
                <span class="segment-label">{{ b.group }}组: {{ b.weight }}% ({{ b.version }})</span>
              </div>
            </div>

            <!-- 流量权重快速调节 (金丝雀放量模拟) -->
            <div class="weight-preset-row">
              <span class="preset-label">模拟放量调节:</span>
              <button class="preset-btn" @click="setWeights(appId, { A: 50, B: 50 })">
                50:50 (对半实验)
              </button>
              <button class="preset-btn" @click="setWeights(appId, { A: 80, B: 20 })">
                80:20 (小流量灰度)
              </button>
              <button class="preset-btn" @click="setWeights(appId, { A: 20, B: 80 })">
                20:80 (大流量放量)
              </button>
              <button class="preset-btn" @click="setWeights(appId, { A: 0, B: 100 })">
                0:100 (推全实验组)
              </button>
            </div>
          </div>
        </div>

        <!-- 实时分流曝光日志展示 -->
        <div class="exposure-log-card">
          <div class="log-header">
            <h4>📡 实时 A/B 分流曝光流水 (Real-time Exposure Stream)</h4>
            <span class="log-count">已捕获 {{ versionManager.exposureLogs.value.length }} 条事件</span>
          </div>
          <div class="log-stream-list">
            <div
              v-for="(log, idx) in versionManager.exposureLogs.value"
              :key="idx"
              class="log-item"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-app">{{ log.appName }}</span>
              <span class="log-group-pill">分组 {{ log.group }}</span>
              <span class="log-ver">{{ log.version }}</span>
              <span class="log-visitor">访客: {{ log.visitorId }}</span>
            </div>
            <div v-if="versionManager.exposureLogs.value.length === 0" class="log-empty">
              切换子应用选项卡时将在此处实时捕获分流曝光埋点...
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作与 JSON 查看 -->
      <div class="modal-footer">
        <button class="json-toggle-btn" @click="showJson = !showJson">
          {{ showJson ? '收起 Manifest JSON 源码' : '📋 查看完整 version-manifest.json' }}
        </button>
        <span class="footer-tip">
          💡 A/B 测试支持通过 URL 直接指定验收，例如携带 <code>?subMall_ab=A</code> 或 <code>?subMall_ab=B</code>
        </span>
      </div>

      <!-- JSON 代码展开 -->
      <div v-if="showJson" class="json-viewer-box">
        <pre><code>{{ JSON.stringify(manifest, null, 2) }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { versionManager, bridgeService } from '../utils';

const props = withDefaults(defineProps<{
  visible: boolean;
  initialTab?: 'versions' | 'abtest';
}>(), {
  initialTab: 'versions'
});

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
  (e: 'version-switched', payload: { appId: string; version: string }): void;
}>();

const manifest = versionManager.getManifest();
const showJson = ref(false);
const activeTab = ref<'versions' | 'abtest'>(props.initialTab || 'versions');

watch(() => props.visible, (v) => {
  if (v && props.initialTab) {
    activeTab.value = props.initialTab;
  }
});

watch(() => props.initialTab, (t) => {
  if (t) activeTab.value = t;
});

const currentVisitorId = computed(() => versionManager.getVisitorId());

// 检查是否存在正在运行中的实验
const hasActiveExperiments = computed(() => {
  if (!manifest.value.experiments) return false;
  return Object.values(manifest.value.experiments).some(e => e.enabled);
});

const experimentsList = computed(() => {
  return manifest.value.experiments || {};
});

const getAppIcon = (appId: string) => {
  return manifest.value.apps[appId]?.icon || '📦';
};

const getExpResult = (appId: string) => {
  return versionManager.evaluateExperiment(appId);
};

const getBucketColor = (appId: string) => {
  const res = getExpResult(appId);
  return res.bucket?.color || (res.group === 'B' ? '#10b981' : '#64748b');
};

const formatBucketRatio = (buckets: any[]) => {
  if (!buckets) return '';
  return buckets.map(b => `${b.group}组(${b.name}): ${b.weight}%`).join('  |  ');
};

const formatTime = (isoStr: string) => {
  if (!isoStr) return '刚刚';
  try {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch (e) {
    return isoStr;
  }
};

const isRollback = (appId: string, targetVer: string) => {
  const current = versionManager.getActiveVersion(appId);
  return targetVer < current;
};

// 切换版本/一键回滚
const handleSelectVersion = (appId: string, version: string, tag: string) => {
  const isRolled = isRollback(appId, version);
  versionManager.switchVersion(appId, version);
  
  const appConfig = versionManager.getAppConfig(appId);
  const appName = appConfig?.name || appId;

  bridgeService.showToast(
    isRolled
      ? `✅ 已回滚！${appName} 切换至 ${version} (${tag})`
      : `🚀 切换成功！${appName} 升级为 ${version} (${tag})`,
    'success'
  );
  bridgeService.vibrate();

  emit('version-switched', { appId, version });
};

// 重新摇号模拟新用户
const handleRerollVisitor = () => {
  const newId = versionManager.resetVisitorId();
  bridgeService.showToast(`🎲 访客 ID 已重置为: ${newId}，已触发全站重新分流！`, 'info');
  bridgeService.vibrate();
  emit('version-switched', { appId: 'all', version: 'reroll' });
};

// 切换/暂停实验
const toggleExp = (appId: string) => {
  versionManager.toggleExperiment(appId);
  const exp = manifest.value.experiments?.[appId];
  bridgeService.showToast(`🧪 ${exp?.name} 状态已更新为: ${exp?.enabled ? '开启' : '已暂停'}`, 'info');
  bridgeService.vibrate();
  emit('version-switched', { appId, version: versionManager.getActiveVersion(appId) });
};

// 人工强制锁定 A/B 组
const handleForceAbGroup = (appId: string, group: string) => {
  versionManager.setAppAbOverride(appId, group);
  const appConfig = versionManager.getAppConfig(appId);
  if (group === 'AUTO') {
    bridgeService.showToast(`⚡ 已解除锁定，${appConfig?.name || appId} 恢复自然算法分流`, 'info');
  } else {
    bridgeService.showToast(`🎯 已强制锁定为 ${group} 组进行效果验收`, 'success');
  }
  bridgeService.vibrate();
  emit('version-switched', { appId, version: versionManager.getActiveVersion(appId) });
};

// 调节流量比例
const setWeights = (appId: string, weights: { [group: string]: number }) => {
  versionManager.updateExperimentWeights(appId, weights);
  bridgeService.showToast(`📊 流量权重已调整为: ${Object.entries(weights).map(([k, v]) => `${k}:${v}%`).join(' ')}`, 'info');
  bridgeService.vibrate();
  emit('version-switched', { appId, version: versionManager.getActiveVersion(appId) });
};

// 恢复全部线上默认状态
const handleResetAll = () => {
  versionManager.resetToManifestDefault();
  bridgeService.showToast('🔄 已清除全部本地覆写与锁定，恢复线上 Manifest 默认规则', 'info');
  bridgeService.vibrate();
  emit('version-switched', { appId: 'all', version: 'default' });
};
</script>

<style scoped>
.version-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.version-modal-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 18px;
  width: 100%;
  max-width: 840px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15);
  overflow: hidden;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #1e293b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, #1e293b, #0f172a);
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 26px;
  background: rgba(56, 189, 248, 0.15);
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #f8fafc;
}

.sub-desc {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* 选项卡导航 */
.modal-tab-bar {
  display: flex;
  background: #090e1a;
  border-bottom: 1px solid #1e293b;
  padding: 0 24px;
  gap: 8px;
}

.modal-tab-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.modal-tab-btn:hover {
  color: #f8fafc;
}

.modal-tab-btn.is-active {
  color: #38bdf8;
  border-bottom-color: #38bdf8;
  background: rgba(56, 189, 248, 0.05);
}

.tab-badge-pulse {
  background: #10b981;
  color: #0f172a;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 10px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.95); }
}

.manifest-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: #131d31;
  border-bottom: 1px solid #1e293b;
  font-size: 12px;
}

.status-col {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  color: #64748b;
}

.status-val {
  font-weight: 600;
  color: #e2e8f0;
}

.visitor-code {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.mini-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #cbd5e1;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mini-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
}

.reset-all-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-all-btn:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
}

.app-version-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.app-card {
  background: #172033;
  border: 1px solid #283548;
  border-radius: 14px;
  padding: 16px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.app-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-icon {
  font-size: 24px;
}

.app-title-box h4 {
  margin: 0;
  font-size: 15px;
  color: #f8fafc;
}

.app-id {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.current-badge-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.active-badge {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: #4ade80;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
}

.override-tag {
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.4);
  color: #facc15;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 20px;
}

.version-list-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.version-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 12px 16px;
  transition: all 0.2s;
}

.version-card.is-active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.05);
}

.version-card.is-manifest-default {
  border-left: 3px solid #38bdf8;
}

.ver-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.ver-name-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ver-num {
  font-weight: 700;
  font-size: 14px;
  color: #f8fafc;
  font-family: monospace;
}

.tag-pill {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.tag-green {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.tag-gray {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.default-badge {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
}

.ver-time {
  font-size: 11px;
  color: #64748b;
}

.ver-desc {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

.ver-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px dashed #1e293b;
}

.ver-entry-path {
  font-size: 11px;
  color: #475569;
  font-family: monospace;
}

.ver-actions {
  display: flex;
  gap: 8px;
}

.btn-current {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: default;
}

.btn-switch {
  font-size: 11px;
  padding: 5px 14px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-rollback {
  background: #ea580c;
  color: white;
}

.btn-rollback:hover {
  background: #f97316;
}

.btn-upgrade {
  background: #0284c7;
  color: white;
}

.btn-upgrade:hover {
  background: #0ea5e9;
}

/* ================== A/B 测试专用样式 ================== */
.ab-test-scroll {
  gap: 16px;
}

.ab-intro-banner {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.intro-icon {
  font-size: 32px;
}

.intro-body {
  flex: 1;
}

.intro-title {
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 4px;
}

.intro-desc {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

.intro-desc code {
  color: #38bdf8;
  font-family: monospace;
}

.reroll-action-btn {
  background: #0284c7;
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.reroll-action-btn:hover {
  background: #0ea5e9;
  transform: translateY(-1px);
}

.ab-experiment-card {
  background: #172033;
  border: 1px solid #283548;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exp-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.exp-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exp-header-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.exp-header-top h4 {
  margin: 0;
  font-size: 15px;
  color: #f8fafc;
}

.exp-status-chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.chip-running {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.chip-paused {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.4);
}

.exp-metric-tag {
  font-size: 11px;
  color: #38bdf8;
  display: block;
  margin-top: 2px;
}

.toggle-exp-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #334155;
  color: #94a3b8;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-exp-btn.btn-on {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.toggle-exp-btn.btn-on:hover {
  background: rgba(239, 68, 68, 0.25);
}

.exp-desc-text {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

/* 本机分流结果 */
.user-bucket-status-panel {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.bucket-status-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-label {
  font-size: 11px;
  color: #64748b;
}

.bucket-result-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bucket-group-tag {
  color: white;
  font-weight: 800;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.bucket-result-name {
  font-size: 13px;
  color: #f8fafc;
}

.bucket-version-pill {
  font-size: 11px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.override-warn-chip {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(234, 179, 8, 0.4);
}

.hash-score-chip {
  font-size: 10px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.bucket-disabled-text {
  font-size: 12px;
  color: #64748b;
}

.ab-quick-switch-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 11px;
  color: #64748b;
}

.ab-group-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.ab-group-btn:hover {
  background: #334155;
  color: white;
}

.ab-group-btn.is-selected {
  background: #0284c7;
  border-color: #38bdf8;
  color: white;
  font-weight: 700;
}

.ab-auto-btn {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.ab-auto-btn.is-active {
  background: #10b981;
  color: #0f172a;
  font-weight: 700;
}

/* 进度条与放量调节 */
.traffic-slider-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 12px 16px;
}

.traffic-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.traffic-title {
  color: #94a3b8;
  font-weight: 600;
}

.traffic-detail-text {
  color: #64748b;
  font-size: 11px;
}

.traffic-ratio-bar {
  display: flex;
  height: 22px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
}

.ratio-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
  font-size: 10px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  padding: 0 6px;
}

.weight-preset-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 4px;
}

.preset-label {
  font-size: 11px;
  color: #64748b;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #334155;
  color: #94a3b8;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
}

/* 实时流水卡片 */
.exposure-log-card {
  background: #172033;
  border: 1px solid #283548;
  border-radius: 14px;
  padding: 14px 16px;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.log-header h4 {
  margin: 0;
  font-size: 13px;
  color: #f8fafc;
}

.log-count {
  font-size: 11px;
  color: #64748b;
}

.log-stream-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  background: #0f172a;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #1e293b;
}

.log-time {
  color: #64748b;
  font-family: monospace;
}

.log-app {
  color: #f8fafc;
  font-weight: 600;
}

.log-group-pill {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 1px 6px;
  border-radius: 4px;
}

.log-ver {
  color: #4ade80;
  font-family: monospace;
}

.log-visitor {
  color: #64748b;
  margin-left: auto;
  font-family: monospace;
}

.log-empty {
  font-size: 11px;
  color: #475569;
  text-align: center;
  padding: 10px 0;
}

/* 底部操作 */
.modal-footer {
  padding: 12px 24px;
  background: #090e1a;
  border-top: 1px solid #1e293b;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.json-toggle-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.json-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.footer-tip {
  font-size: 11px;
  color: #64748b;
}

.footer-tip code {
  color: #38bdf8;
  font-family: monospace;
}

.json-viewer-box {
  max-height: 200px;
  overflow-y: auto;
  background: #020617;
  border-top: 1px solid #1e293b;
  padding: 14px 24px;
}

.json-viewer-box pre {
  margin: 0;
  font-family: monospace;
  font-size: 11px;
  color: #38bdf8;
  line-height: 1.4;
}
</style>
