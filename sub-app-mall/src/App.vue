<template>
  <div class="mall-app-view">
    <!-- 1. 原生直接使用 Module Federation 导入的主应用公共组件 CommonNavbar -->
    <CommonNavbar
      title="微商城 (Sub-App Mall)"
      sub-badge="Port:3001"
      right-action-text="分享"
      @back="onNavbarBack"
      @right-click="onShare"
    />

    <div class="page-content">
      <!-- 模块联邦接入标识 -->
      <div class="mode-banner">
        <span class="dot"></span>
        <span>Module Federation 模块联邦模式（零沙箱损耗，直接 import）</span>
      </div>

      <!-- 2. 原生调用 Module Federation 导入的主应用鉴权方法 -->
      <div class="user-greeting-card">
        <div class="card-title">主应用公共方法 authService：</div>
        <div class="user-info-text">
          欢迎，<strong>{{ userInfo.nickname }}</strong>
          <span class="role-badge">{{ userInfo.role }}</span>
        </div>
        <div class="token-text">Token: {{ maskToken(token) }}</div>
      </div>

      <!-- 商品展示列表 -->
      <div class="section-title">热门爆款商品 (点击触发主应用加购)</div>
      <div class="goods-list">
        <div v-for="item in goodsList" :key="item.id" class="goods-card">
          <div class="goods-emoji">{{ item.emoji }}</div>
          <div class="goods-detail">
            <h4 class="goods-name">{{ item.name }}</h4>
            <p class="goods-desc">{{ item.desc }}</p>
            <div class="price-row">
              <span class="goods-price">¥{{ item.price }}</span>

              <!-- 3. 原生直接使用主应用公共组件 CommonButton -->
              <CommonButton
                size="small"
                type="primary"
                @click="handleAddToCart(item)"
              >
                + 加购物车
              </CommonButton>
            </div>
          </div>
        </div>
      </div>

      <div class="feature-tip">
        ⚡ <strong>Module Federation 核心体验</strong>：<br/>
        当前组件代码中直接执行：<br/>
        <code>import CommonButton from 'mainApp/CommonButton';</code><br/>
        <code>import { authService, bridgeService } from 'mainApp/utils';</code><br/>
        无需复杂的基座代理，完全具备本地组件的原生开发体验！
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 🌟 核心：通过模块联邦直接 import 主应用公共组件与方法
import CommonNavbar from 'mainApp/CommonNavbar';
import CommonButton from 'mainApp/CommonButton';
import { authService, bridgeService, globalEventBus } from 'mainApp/utils';

// 获取主应用公共方法数据
const userInfo = ref(authService.getUserInfo());
const token = ref(authService.getToken());

const maskToken = (t: string) => {
  if (!t || t.length < 10) return t;
  return t.slice(0, 8) + '...' + t.slice(-4);
};

// 模拟商品数据
const goodsList = ref([
  { id: 1, name: 'iPhone 16 Pro Max (256G)', price: '9,999', emoji: '📱', desc: '超强钛金属边框，微前端畅爽体验' },
  { id: 2, name: 'AirPods Max 2 代降噪耳机', price: '3,999', emoji: '🎧', desc: '主子应用高保真音频传输' },
  { id: 3, name: 'MacBook Pro 16寸 M3 Max', price: '24,999', emoji: '💻', desc: '全栈微前端高性能开发利器' }
]);

// 按钮交互：调用主应用下发的公共动作与方法
const handleAddToCart = (item: any) => {
  // 1. 通过全局事件总线通知主应用更新购物车数字
  globalEventBus.emit('cart:add', { count: 1, name: item.name });

  // 2. 调用主应用暴露的 JSBridge 原生方法
  bridgeService.showToast(`[商城] 已将《${item.name}》加入购物车`, 'success');
  bridgeService.vibrate();
};

const onNavbarBack = () => {
  bridgeService.showToast('商城点击了主应用导航栏【返回】', 'info');
};

const onShare = () => {
  bridgeService.callNativeShare({
    title: '微前端热卖商城好物推荐',
    desc: 'Module Federation 真实模块联邦体验',
    link: window.location.href
  });
};
</script>

<style scoped>
.mall-app-view {
  min-height: 100%;
  background: #090d16;
  color: #e2e8f0;
  padding-bottom: 24px;
}

.page-content {
  padding: 14px;
}

.mode-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 6px 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  color: #34d399;
}

.dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}

.user-greeting-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 11px;
  color: #38bdf8;
  margin-bottom: 4px;
}

.user-info-text {
  font-size: 14px;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-badge {
  background: #f59e0b;
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.token-text {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  font-family: monospace;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 10px;
}

.goods-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goods-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
}

.goods-emoji {
  font-size: 36px;
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goods-detail {
  flex: 1;
}

.goods-name {
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 2px 0;
}

.goods-desc {
  font-size: 11px;
  color: #94a3b8;
  margin: 0 0 6px 0;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.goods-price {
  font-size: 14px;
  font-weight: 700;
  color: #f43f5e;
}

.feature-tip {
  margin-top: 18px;
  font-size: 11px;
  line-height: 1.6;
  color: #94a3b8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px dashed rgba(56, 189, 248, 0.3);
  padding: 10px;
  border-radius: 8px;
}
</style>
