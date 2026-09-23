<template>
  <div class="user-app-view">
    <!-- 1. 原生直接使用 Module Federation 导入的主应用公共组件 CommonNavbar -->
    <CommonNavbar
      title="个人中心 (Sub-App User)"
      sub-badge="Port:3003"
      right-action-text="设置"
      @back="onBack"
      @right-click="onSettings"
    />

    <div class="page-content">
      <!-- 个人资料卡片 (直接拉取主应用 Auth 数据) -->
      <div class="profile-card">
        <div class="avatar-wrap">
          <img :src="userInfo.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=h5-default'" class="avatar-img" />
        </div>
        <div class="profile-meta">
          <div class="nickname-row">
            <h3>{{ userInfo.nickname }}</h3>
            <span class="badge-role">{{ userInfo.role }}</span>
          </div>
          <p class="user-id">UID: {{ userInfo.userId }}</p>
        </div>
      </div>

      <!-- 会员权益区块 -->
      <div class="vip-benefit-card">
        <div class="benefit-header">
          <span class="gold-text">👑 黑金 SVIP 专享特权</span>
          <span class="expiry-tag">永久有效</span>
        </div>
        <div class="benefit-grid">
          <div class="benefit-item">
            <span class="item-icon">🚚</span>
            <span class="item-name">全场包邮</span>
          </div>
          <div class="benefit-item">
            <span class="item-icon">⚡</span>
            <span class="item-name">极速退款</span>
          </div>
          <div class="benefit-item">
            <span class="item-icon">🎁</span>
            <span class="item-name">生日礼包</span>
          </div>
          <div class="benefit-item">
            <span class="item-icon">🎧</span>
            <span class="item-name">专属客服</span>
          </div>
        </div>
      </div>

      <!-- 签到打卡 (调用主应用组件与方法) -->
      <div class="checkin-card">
        <div class="checkin-info">
          <h4>每日健康打卡</h4>
          <p>今日打卡即可在主应用领取 +20 积分奖励</p>
        </div>
        <!-- 2. 原生直接使用 Module Federation 导入的主应用公共组件 CommonButton -->
        <CommonButton
          :type="isCheckedIn ? 'success' : 'primary'"
          size="small"
          :disabled="isCheckedIn"
          @click="handleCheckin"
        >
          {{ isCheckedIn ? '✓ 今日已签到' : '立即打卡' }}
        </CommonButton>
      </div>

      <!-- 退出登录区 -->
      <div class="logout-wrap">
        <CommonButton
          type="danger"
          size="medium"
          :block="true"
          @click="handleLogout"
        >
          安全退出登录
        </CommonButton>
      </div>

      <div class="tips-box">
        ⚡ <strong>Module Federation 优势</strong>：<br/>
        个人中心微应用直接 <code>import CommonButton from 'mainApp/CommonButton';</code>，与本地组件一模一样，无任何跨应用数据桥接代码！
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 🌟 核心：模块联邦原生 import 组件与方法
import CommonNavbar from 'mainApp/CommonNavbar';
import CommonButton from 'mainApp/CommonButton';
import { authService, bridgeService, globalEventBus } from 'mainApp/utils';

const userInfo = ref(authService.getUserInfo());
const isCheckedIn = ref(false);

const onBack = () => {
  bridgeService.showToast('个人中心点击了主应用导航栏【返回】', 'info');
};

const onSettings = () => {
  bridgeService.showToast('点击了主应用导航栏右上角【设置】', 'info');
};

const handleCheckin = () => {
  if (isCheckedIn.value) return;
  isCheckedIn.value = true;
  // 调用主应用增加积分的方法并广播事件
  authService.updatePoints(20);
  globalEventBus.emit('points:update', { delta: 20, reason: '个人中心打卡签到' });
  bridgeService.showToast('打卡成功！积分 +20', 'success');
};

const handleLogout = () => {
  bridgeService.showToast('已安全退出登录', 'warning');
};
</script>

<style scoped>
.user-app-view {
  min-height: 100%;
  background: #090d16;
  color: #e2e8f0;
  padding-bottom: 30px;
}

.page-content {
  padding: 14px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 14px;
  margin-bottom: 14px;
}

.avatar-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #38bdf8;
  background: #1e293b;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-meta {
  flex: 1;
}

.nickname-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname-row h3 {
  margin: 0;
  font-size: 15px;
  color: #f8fafc;
}

.badge-role {
  background: #f59e0b;
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.user-id {
  font-size: 11px;
  color: #94a3b8;
  margin: 4px 0 0;
  font-family: monospace;
}

.vip-benefit-card {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
}

.benefit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.gold-text {
  color: #fcd34d;
  font-size: 13px;
  font-weight: 600;
}

.expiry-tag {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.benefit-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.benefit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.item-icon {
  font-size: 22px;
}

.item-name {
  font-size: 11px;
  color: #cbd5e1;
}

.checkin-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.checkin-info h4 {
  margin: 0 0 2px;
  font-size: 13px;
  color: #f1f5f9;
}

.checkin-info p {
  margin: 0;
  font-size: 11px;
  color: #94a3b8;
}

.logout-wrap {
  margin-top: 10px;
}

.tips-box {
  margin-top: 20px;
  font-size: 11px;
  color: #94a3b8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px dashed rgba(56, 189, 248, 0.3);
  padding: 10px;
  border-radius: 8px;
  line-height: 1.6;
}
</style>
