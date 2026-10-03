<template>
  <div class="activity-app-view">
    <CommonNavbar
      title="福利狂欢转盘 (hyper-activity)"
      sub-badge="独立对等应用:3002"
      right-action-text="规则"
      @back="onBack"
      @right-click="showRulesModal = true"
    />

    <div class="page-content">
      <!-- 轮播横幅 -->
      <div :class="['activity-banner', isCarnivalVersion ? 'banner-carnival' : 'banner-classic']">
        <span class="banner-tag">{{ isCarnivalVersion ? '🎉 黄金周狂欢特别版 (v1.1.0)' : '🎡 经典稳定版 (v1.0.0)' }}</span>
        <h3>{{ isCarnivalVersion ? '🔥 黄金周狂欢大转盘 · 概率 100% 翻倍' : '幸运积分大转盘' }}</h3>
        <p v-if="isCarnivalVersion">狂欢特惠上线！特等奖翻倍送，可在右下角实验中心一键回滚至 v1.0.0 验证热切换！</p>
        <p v-else>经典稳定抽奖，100% 必中，抽中积分直接汇入统一全局账户！</p>
      </div>

      <!-- 抽奖格子面板 -->
      <div class="wheel-box">
        <div
          v-for="(prize, index) in prizes"
          :key="index"
          class="prize-cell"
          :class="{ 'is-selected': activeIndex === index }"
        >
          <div class="prize-icon">{{ prize.icon }}</div>
          <div class="prize-name">{{ prize.name }}</div>
        </div>
      </div>

      <div class="action-wrap">
        <CommonButton
          type="warning"
          size="large"
          :block="true"
          :loading="isSpinning"
          @click="startDraw"
        >
          {{ isSpinning ? '幸运转盘高速旋转中...' : '🎲 立即免费抽奖 (消耗0积分)' }}
        </CommonButton>
      </div>

      <div class="tips-box">
        ⚡ <strong>去中心化对等微应用 (hyper-activity)</strong>：<br/>
        抽奖结束后，通过 <code>hyperEventBus.emit('points:update')</code> 和 <code>bridgeService.showToast</code> 全局广播积分状态！
      </div>

      <!-- 🌟 对等微应用就地嵌入 (Peer Widgets) -->
      <div class="peer-embed-section">
        <div class="embed-title">🔗 对等微应用就地嵌入组件 (Peer Widgets)</div>
        <HyperAsyncWidget appId="hyperMall" exposePath="./ProductCard" />
        <HyperAsyncWidget appId="hyperUser" exposePath="./UserCard" />
      </div>
    </div>

    <!-- 中奖弹窗 -->
    <CommonModal
      v-model:visible="showPrizeModal"
      title="🎉 恭喜获得奖励！"
      confirm-text="开心收下"
      :show-cancel="false"
      @confirm="showPrizeModal = false"
    >
      <div class="prize-modal-content">
        <div class="big-prize-icon">{{ currentWonPrize?.icon }}</div>
        <p>恭喜你在活动对等应用中斩获：</p>
        <h4 class="won-name">{{ currentWonPrize?.name }}</h4>
        <small class="tip-sub">已通过全局事件总线自动同步至全局账户</small>
      </div>
    </CommonModal>

    <!-- 活动规则弹窗 -->
    <CommonModal
      v-model:visible="showRulesModal"
      title="活动规则说明"
      confirm-text="我已知晓"
      :show-cancel="false"
      @confirm="showRulesModal = false"
    >
      <div style="font-size: 13px; line-height: 1.6;">
        1. 本活动运行在独立对等微应用 (端口 3002)；<br/>
        2. 依赖通过 <code>@hyper/core</code> 和 Module Federation 去中心化共享；<br/>
        3. 抽中积分直接同步至全局状态。
      </div>
    </CommonModal>

    <!-- 去中心化版本控制与 A/B 实验调控悬浮中心 -->
    <VersionControlDock />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  CommonNavbar,
  CommonButton,
  CommonModal,
  HyperAsyncWidget,
  VersionControlDock,
  bridgeService,
  hyperEventBus as globalEventBus,
} from '@hyper/core';

declare const __APP_VERSION__: string;
const currentAppVer = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v1.1.0';
const isCarnivalVersion = computed(() => currentAppVer === 'v1.1.0');

const isSpinning = ref(false);
const activeIndex = ref(0);
const showPrizeModal = ref(false);
const showRulesModal = ref(false);
const currentWonPrize = ref<any>(null);

const prizes = [
  { name: '+50 积分', icon: '💎', points: 50 },
  { name: '8折优惠券', icon: '🎫', points: 20 },
  { name: '+100 积分', icon: '💰', points: 100 },
  { name: '免单红包', icon: '🧧', points: 88 },
  { name: '+200 积分', icon: '🌟', points: 200 },
  { name: '感谢参与', icon: '☕', points: 10 }
];

const onBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    bridgeService.showToast('已处于活动首页', 'info');
  }
};

const startDraw = () => {
  if (isSpinning.value) return;
  isSpinning.value = true;
  bridgeService.vibrate();

  let count = 0;
  const targetIndex = Math.floor(Math.random() * prizes.length);
  const totalSteps = prizes.length * 3 + targetIndex;

  const timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % prizes.length;
    count++;
    if (count >= totalSteps) {
      clearInterval(timer);
      isSpinning.value = false;
      const prize = prizes[activeIndex.value];
      currentWonPrize.value = prize;

      globalEventBus.emit('points:update', prize.points);
      bridgeService.showToast(`恭喜抽中 ${prize.name}！已自动入账`, 'success');
      showPrizeModal.value = true;
    }
  }, 60);
};
</script>

<style scoped>
.activity-app-view {
  min-height: 100vh;
  background: #0b0f19;
  color: #e2e8f0;
}
.page-content {
  padding: 14px;
  overflow-y: auto;
  padding-bottom: 70px;
}
.activity-banner {
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}
.banner-carnival {
  background: linear-gradient(135deg, #b45309 0%, #dc2626 100%);
  border: 1px solid rgba(245, 158, 11, 0.4);
}
.banner-classic {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 1px solid rgba(148, 163, 184, 0.3);
}
.banner-tag {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 9999px;
  font-weight: 600;
  margin-bottom: 6px;
}
.activity-banner h3 {
  margin: 4px 0 6px 0;
  font-size: 17px;
  font-weight: 700;
}
.activity-banner p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}
.wheel-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.prize-cell {
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 10px;
  padding: 12px 6px;
  text-align: center;
  transition: all 0.15s ease;
}
.prize-cell.is-selected {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  transform: scale(1.04);
}
.prize-icon {
  font-size: 24px;
  margin-bottom: 4px;
}
.prize-name {
  font-size: 12px;
  font-weight: 600;
  color: #f8fafc;
}
.action-wrap {
  margin-bottom: 16px;
}
.tips-box {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 16px;
}
.peer-embed-section {
  margin-top: 16px;
}
.embed-title {
  font-size: 12px;
  color: #38bdf8;
  font-weight: 600;
  margin-bottom: 8px;
}
.prize-modal-content {
  text-align: center;
  padding: 16px;
}
.big-prize-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.won-name {
  font-size: 18px;
  color: #f59e0b;
  margin: 8px 0;
}
.tip-sub {
  color: #94a3b8;
  font-size: 11px;
}
</style>
