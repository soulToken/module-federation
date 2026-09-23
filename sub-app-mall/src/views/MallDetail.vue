<template>
  <div class="mall-detail-container">
    <div class="detail-header-card">
      <div class="route-badge">
        <span class="route-path">当前页面路由: /mall/detail/{{ productId }}</span>
        <button class="back-link-btn" @click="goBackToList">‹ 返回列表</button>
      </div>

      <div class="product-hero">
        <div class="hero-icon">{{ currentProduct.icon }}</div>
        <h2 class="hero-title">{{ currentProduct.name }}</h2>
        <div class="hero-price-row">
          <span class="hero-price">¥{{ currentProduct.price.toLocaleString() }}</span>
          <span class="hero-tag">官方正品保障</span>
        </div>
      </div>
    </div>

    <!-- 规格参数 -->
    <div class="specs-card">
      <h3>核心规格与参数 (微前端路由跨级状态)</h3>
      <div class="spec-item">
        <span class="label">商品编号:</span>
        <span class="value">SKU-20260{{ productId }}</span>
      </div>
      <div class="spec-item">
        <span class="label">硬件架构:</span>
        <span class="value">Apple Silicon 高性能移动端加速</span>
      </div>
      <div class="spec-item">
        <span class="label">配送支持:</span>
        <span class="value">顺丰特快 (全国次日达)</span>
      </div>
      <div class="spec-item">
        <span class="label">当前登录用户:</span>
        <span class="value text-cyan">{{ userInfo.nickname }} (享有 {{ userInfo.role }} 折扣)</span>
      </div>
    </div>

    <!-- 底部悬浮操作栏 -->
    <div class="detail-bottom-bar">
      <button class="btn-return" @click="goBackToList">
        ‹ 返回
      </button>
      <div class="action-buttons">
        <CommonButton type="primary" size="medium" @click="handleAddToCart">
          加入购物车
        </CommonButton>
        <CommonButton type="warning" size="medium" @click="handleDirectBuy">
          立即购买
        </CommonButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CommonButton from 'mainApp/CommonButton';
import { authService, bridgeService, globalEventBus } from 'mainApp/utils';

const route = useRoute();
const router = useRouter();
const userInfo = ref(authService.getUserInfo());

const productId = computed(() => route.params.id || '1');

const productCatalog: Record<string, any> = {
  '1': { name: 'iPhone 16 Pro Max (256G)', price: 9999, icon: '📱' },
  '2': { name: 'AirPods Max 2 代降噪耳机', price: 3999, icon: '🎧' },
  '3': { name: 'MacBook Pro 16寸 M3 Max', price: 24999, icon: '💻' }
};

const currentProduct = computed(() => {
  return productCatalog[productId.value as string] || productCatalog['1'];
});

const goBackToList = () => {
  // 🌟 子应用内部回退
  router.push('/mall/list');
};

const handleAddToCart = () => {
  globalEventBus.emit('cart:add', { item: currentProduct.value, count: 1 });
  bridgeService.showToast(`[详情页] 已加购《${currentProduct.value.name}》`, 'success');
  bridgeService.vibrate();
};

const handleDirectBuy = () => {
  bridgeService.showToast(`正在调起主应用收银台结算: ¥${currentProduct.value.price}`, 'warning');
};
</script>

<style scoped>
.mall-detail-container {
  padding: 12px;
  padding-bottom: 70px;
}
.detail-header-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 12px;
}
.route-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 12px;
}
.route-path {
  color: #10b981;
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
.product-hero {
  text-align: center;
  padding: 10px 0;
}
.hero-icon {
  font-size: 54px;
  margin-bottom: 8px;
}
.hero-title {
  margin: 0 0 8px;
  font-size: 18px;
  color: #f8fafc;
}
.hero-price-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.hero-price {
  font-size: 24px;
  font-weight: 800;
  color: #ef4444;
}
.hero-tag {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}
.specs-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.specs-card h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #e2e8f0;
}
.spec-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 12px;
}
.label {
  color: #94a3b8;
}
.value {
  color: #cbd5e1;
}
.text-cyan {
  color: #38bdf8;
}
.detail-bottom-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #0f172a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px -12px -12px;
}
.btn-return {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
