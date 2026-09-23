<template>
  <div class="activity-app-view">
    <!-- 1. 原生直接使用 Module Federation 导入的主应用公共组件 CommonNavbar -->
    <CommonNavbar
      title="福利狂欢转盘 (Sub-App Activity)"
      sub-badge="Port:3002"
      right-action-text="规则"
      @back="onBack"
      @right-click="showRulesModal = true"
    />

    <div class="page-content">
      <!-- 轮播横幅 -->
      <div class="activity-banner">
        <span class="banner-tag">🔥 狂欢大促</span>
        <h3>幸运积分大转盘</h3>
        <p>100% 必中，抽中积分直接汇入主应用账户！</p>
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

      <!-- 2. 原生直接使用 Module Federation 导入的主应用公共组件 CommonButton -->
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
        ⚡ <strong>Module Federation 联动展示</strong>：<br/>
        抽奖结束后，子应用通过 <code>globalEventBus.emit('points:update')</code> 和 <code>bridgeService.showToast</code>，主应用顶栏积分将实时递增，并调起主应用公共弹窗 <code>CommonModal</code>！
      </div>
    </div>

    <!-- 3. 原生直接使用 Module Federation 导入的主应用公共弹窗 CommonModal -->
    <CommonModal
      v-model:visible="showPrizeModal"
      title="🎉 恭喜获得奖励！"
      confirm-text="开心收下"
      :show-cancel="false"
      @confirm="showPrizeModal = false"
    >
      <div class="prize-modal-content">
        <div class="big-prize-icon">{{ currentWonPrize?.icon }}</div>
        <p>恭喜你在活动子应用中斩获：</p>
        <h4 class="won-name">{{ currentWonPrize?.name }}</h4>
        <small class="tip-sub">已通过主应用公共方法自动充入主应用账户</small>
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
        1. 本活动运行在独立微应用 (端口 3002)；<br/>
        2. 抽奖按钮采用主应用通过模块联邦下发的 <code>CommonButton</code>；<br/>
        3. 抽中积分直接同步至主应用全局登录态。
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 🌟 核心：模块联邦原生 import 组件与方法
import CommonNavbar from 'mainApp/CommonNavbar';
import CommonButton from 'mainApp/CommonButton';
import CommonModal from 'mainApp/CommonModal';
import { bridgeService, globalEventBus, authService, routeBridge } from 'mainApp/utils';

// 🌟 无独立路由子应用：声明 canGoBack = false
routeBridge.registerSubAppRoute('subActivity', {
  name: 'subActivity',
  currentPath: '/activity',
  canGoBack: false
});

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
  const handled = routeBridge.navigateBack();
  if (!handled) {
    routeBridge.navigateTo('/home');
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
      const won = prizes[targetIndex];
      currentWonPrize.value = won;

      // 1. 调用主应用公共方法增加积分并广播事件
      authService.updatePoints(won.points);
      globalEventBus.emit('points:update', { delta: won.points, reason: `转盘抽中 ${won.name}` });

      // 2. 调起公共弹窗
      showPrizeModal.value = true;
    }
  }, 90);
};
</script>

<style scoped>
.activity-app-view {
  min-height: 100%;
  background: #090d16;
  color: #e2e8f0;
  padding-bottom: 30px;
}

.page-content {
  padding: 14px;
}

.activity-banner {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  padding: 16px;
  border-radius: 14px;
  margin-bottom: 16px;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.banner-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 10px;
}

.activity-banner h3 {
  margin: 8px 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.activity-banner p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.wheel-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.prize-cell {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.prize-cell.is-selected {
  background: rgba(245, 158, 11, 0.25);
  border-color: #f59e0b;
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
}

.prize-icon {
  font-size: 24px;
}

.prize-name {
  font-size: 11px;
  color: #f8fafc;
  margin-top: 4px;
  font-weight: 500;
}

.action-wrap {
  margin-top: 14px;
}

.tips-box {
  margin-top: 20px;
  font-size: 11px;
  color: #94a3b8;
  background: rgba(245, 158, 11, 0.08);
  border: 1px dashed rgba(245, 158, 11, 0.3);
  padding: 10px;
  border-radius: 8px;
  line-height: 1.6;
}

.prize-modal-content {
  text-align: center;
  padding: 10px 0;
}

.big-prize-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.won-name {
  font-size: 18px;
  color: #f59e0b;
  margin: 6px 0;
}

.tip-sub {
  color: #94a3b8;
  font-size: 11px;
}
</style>
