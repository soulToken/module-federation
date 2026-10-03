<template>
  <div class="hyper-lottery-banner">
    <div class="banner-badge">营销活动暴露挂件 · hyperActivity/LotteryBanner</div>
    <div class="banner-body">
      <div class="banner-icon">🎡</div>
      <div class="banner-info">
        <h4>{{ title }}</h4>
        <p>{{ desc }}</p>
      </div>
      <button class="draw-btn" @click="handleLuckyDraw">
        🎯 立即抽奖
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { bridgeService, hyperEventBus } from '@hyper/core';

withDefaults(defineProps<{
  title?: string;
  desc?: string;
}>(), {
  title: '福利大转盘 100% 必中',
  desc: '来自 hyper-activity 独立微应用的原子营销挂件',
});

function handleLuckyDraw() {
  const prizes = ['888 积分', '全场 8 折优惠券', '免单大奖', '100 积分'];
  const won = prizes[Math.floor(Math.random() * prizes.length)];
  hyperEventBus.emit('points:update', 88);
  bridgeService.showToast(`[hyper-activity] 🎉 恭喜抽中【${won}】！已入账！`, 'success');
  bridgeService.vibrate();
}
</script>

<style scoped>
.hyper-lottery-banner {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15));
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 12px;
  padding: 12px 16px;
  margin: 12px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
.banner-badge {
  font-size: 11px;
  color: #f59e0b;
  font-weight: 600;
  margin-bottom: 6px;
  display: inline-block;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}
.banner-body {
  display: flex;
  align-items: center;
  gap: 12px;
}
.banner-icon {
  font-size: 32px;
}
.banner-info {
  flex: 1;
}
.banner-info h4 {
  margin: 0 0 2px 0;
  font-size: 14px;
  color: #f8fafc;
}
.banner-info p {
  margin: 0;
  font-size: 12px;
  color: #cbd5e1;
}
.draw-btn {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
  transition: transform 0.15s ease;
}
.draw-btn:hover {
  transform: scale(1.05);
}
</style>
