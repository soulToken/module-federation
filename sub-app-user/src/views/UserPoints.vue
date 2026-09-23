<template>
  <div class="user-points-container">
    <div class="header-card">
      <div class="route-badge">
        <span class="route-path">当前页面路由: /user/points</span>
        <button class="back-link-btn" @click="goBackToHome">‹ 返回个人中心</button>
      </div>

      <div class="points-hero">
        <span class="hero-label">当前总积分</span>
        <h2 class="hero-value">{{ userPoints }}</h2>
        <span class="hero-desc">可在商城下单时抵扣现金</span>
      </div>
    </div>

    <!-- 积分流水明细列表 -->
    <div class="records-card">
      <div class="card-header">
        <h3>积分收支明细 (二级路由状态)</h3>
        <span class="badge-total">共 {{ records.length }} 笔记录</span>
      </div>

      <div class="record-list">
        <div v-for="rec in records" :key="rec.id" class="record-item">
          <div class="rec-left">
            <span class="rec-title">{{ rec.title }}</span>
            <span class="rec-date">{{ rec.date }}</span>
          </div>
          <span :class="['rec-points', rec.amount > 0 ? 'text-green' : 'text-red']">
            {{ rec.amount > 0 ? `+${rec.amount}` : rec.amount }}
          </span>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-action-bar">
      <CommonButton type="primary" size="medium" @click="goBackToHome">
        ‹ 返回个人中心首页
      </CommonButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import CommonButton from 'mainApp/CommonButton';
import { authService } from 'mainApp/utils';

const router = useRouter();
const userInfo = ref(authService.getUserInfo());
const userPoints = ref(userInfo.value.points);

const records = ref([
  { id: 1, title: '每日健康打卡奖励', date: '今天 08:30', amount: 20 },
  { id: 2, title: '活动大转盘抽奖获得', date: '昨天 15:20', amount: 50 },
  { id: 3, title: '微商城加购消费赠送', date: '3天前', amount: 100 },
  { id: 4, title: '新用户注册新人礼包', date: '2026-09-01', amount: 500 }
]);

const goBackToHome = () => {
  // 🌟 子应用内部回退
  router.push('/user/home');
};
</script>

<style scoped>
.user-points-container {
  padding: 12px;
  padding-bottom: 70px;
}
.header-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
}
.route-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.3);
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 12px;
}
.route-path {
  color: #c084fc;
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
}
.back-link-btn {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
}
.points-hero {
  text-align: center;
  padding: 10px 0;
}
.hero-label {
  color: #94a3b8;
  font-size: 12px;
}
.hero-value {
  margin: 6px 0;
  font-size: 32px;
  font-weight: 800;
  color: #f59e0b;
}
.hero-desc {
  font-size: 11px;
  color: #64748b;
}
.records-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.card-header h3 {
  margin: 0;
  font-size: 13px;
  color: #e2e8f0;
}
.badge-total {
  font-size: 11px;
  color: #64748b;
}
.record-list {
  display: flex;
  flex-direction: column;
}
.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.record-item:last-child {
  border-bottom: none;
}
.rec-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rec-title {
  font-size: 13px;
  color: #f1f5f9;
}
.rec-date {
  font-size: 11px;
  color: #64748b;
}
.rec-points {
  font-size: 15px;
  font-weight: 700;
}
.text-green { color: #10b981; }
.text-red { color: #ef4444; }
.bottom-action-bar {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
