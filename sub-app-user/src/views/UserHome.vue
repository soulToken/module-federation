<template>
  <div class="user-home-container">
    <div class="route-badge-box">
      <span class="route-tag">子应用独立路由: /user/home</span>
      <span class="tip-text">点击下方“查看积分明细”可跳转到个人中心二级路由页面</span>
    </div>

    <!-- 个人信息卡片 -->
    <div class="profile-card">
      <div class="avatar-box">
        <span class="avatar-icon">🤖</span>
      </div>
      <div class="profile-info">
        <div class="name-row">
          <span class="nickname">{{ userInfo.nickname }}</span>
          <span class="vip-tag">{{ userInfo.role }}</span>
        </div>
        <div class="uid-text">UID: U-889901</div>
      </div>
    </div>

    <!-- 资产面板 -->
    <div class="assets-card">
      <div class="asset-item" @click="goToPointsDetail">
        <span class="asset-num text-orange">{{ userPoints }}</span>
        <span class="asset-label">当前积分 (点击看明细 ❯)</span>
      </div>
      <div class="asset-item">
        <span class="asset-num text-green">12</span>
        <span class="asset-label">优惠券 (张)</span>
      </div>
      <div class="asset-item">
        <span class="asset-num text-cyan">¥88.00</span>
        <span class="asset-label">钱包余额</span>
      </div>
    </div>

    <!-- 路由跳转功能入口 -->
    <div class="menu-list">
      <div class="menu-item" @click="goToPointsDetail">
        <div class="menu-left">
          <span class="menu-icon">💎</span>
          <span>积分流水与明细记录 (二级页面)</span>
        </div>
        <span class="menu-arrow">❯</span>
      </div>
      <div class="menu-item" @click="handleCheckIn">
        <div class="menu-left">
          <span class="menu-icon">📅</span>
          <span>每日健康打卡 (+20 积分)</span>
        </div>
        <CommonButton size="small" type="primary" :disabled="isCheckedIn">
          {{ isCheckedIn ? '已打卡' : '打卡' }}
        </CommonButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import CommonButton from 'mainApp/CommonButton';
import { authService, bridgeService, globalEventBus } from 'mainApp/utils';

const router = useRouter();
const userInfo = ref(authService.getUserInfo());
const userPoints = ref(userInfo.value.points);
const isCheckedIn = ref(false);

const goToPointsDetail = () => {
  // 🌟 子应用内部路由跳转到积分明细页
  router.push('/user/points');
};

const handleCheckIn = () => {
  if (isCheckedIn.value) return;
  authService.updatePoints(20);
  userInfo.value = authService.getUserInfo();
  userPoints.value = userInfo.value.points;
  isCheckedIn.value = true;
  globalEventBus.emit('points:update', { points: userPoints.value });
  bridgeService.showToast('[个人中心] 打卡成功，积分 +20！', 'success');
  bridgeService.vibrate();
};
</script>

<style scoped>
.user-home-container {
  padding: 12px;
}
.route-badge-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(168, 85, 247, 0.1);
  border: 1px dashed rgba(168, 85, 247, 0.4);
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.route-tag {
  color: #c084fc;
  font-family: monospace;
  font-weight: 600;
  font-size: 13px;
}
.tip-text {
  color: #94a3b8;
  font-size: 11px;
}
.profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}
.avatar-box {
  width: 48px;
  height: 48px;
  background: #334155;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nickname {
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
}
.vip-tag {
  background: #f59e0b;
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}
.uid-text {
  color: #64748b;
  font-size: 11px;
  margin-top: 4px;
}
.assets-card {
  display: flex;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 0;
  margin-bottom: 12px;
}
.asset-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
.asset-item:last-child {
  border-right: none;
}
.asset-num {
  font-size: 17px;
  font-weight: 700;
}
.text-orange { color: #f59e0b; }
.text-green { color: #10b981; }
.text-cyan { color: #38bdf8; }
.asset-label {
  color: #94a3b8;
  font-size: 11px;
  margin-top: 4px;
}
.menu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.menu-item:active {
  background: #334155;
}
.menu-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #cbd5e1;
}
.menu-arrow {
  color: #64748b;
  font-size: 12px;
}
</style>
