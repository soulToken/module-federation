<template>
  <div class="mall-list-container">
    <div class="route-badge-box">
      <span class="route-tag">子应用独立路由: /mall/list</span>
      <span class="tip-text">点击商品进入详情页，体验多级路由跳转与回退</span>
    </div>

    <!-- 模块联邦接入标识 -->
    <div class="feature-tip-mini">
      ⚡ <strong>Sub-App Mall 正在运行 (Port: 3001)</strong>
      <div class="user-row">
        <span>当前主应用登录态:</span>
        <strong class="user-name">{{ userInfo.nickname }}</strong>
        <span class="vip-tag">{{ userInfo.role }}</span>
      </div>
    </div>

    <!-- 多版本状态提示条 -->
    <div :class="['version-indicator-bar', isPromoVersion ? 'bar-promo' : 'bar-stable']">
      <div class="ver-header">
        <span class="ver-badge">{{ isPromoVersion ? '🚀 v1.1.0 大促特惠版' : '🛡️ v1.0.0 经典稳定版' }}</span>
        <span class="ver-status">{{ isPromoVersion ? '🔥 全场限时 8 折秒杀立减中' : '✅ 稳定基线运行中' }}</span>
      </div>
      <p v-if="isPromoVersion" class="ver-note">
        本模块由 Manifest 动态指定加载 v1.1.0；可在右上角版本管理中心「一键回滚」至 v1.0.0 验证热切换！
      </p>
      <p v-else class="ver-note">
        当前为经典稳定基线版本，已成功从大促版回滚，商品恢复标准标价！
      </p>
    </div>

    <!-- 商品列表 -->
    <div class="product-list">
      <div
        v-for="item in products"
        :key="item.id"
        class="product-card"
        @click="goToDetail(item.id)"
      >
        <div class="product-icon">{{ item.icon }}</div>
        <div class="product-info">
          <div class="title-row">
            <h4>{{ item.name }}</h4>
            <span v-if="isPromoVersion" class="badge-promo">-20% 特惠</span>
            <span v-else class="badge-hot">热卖</span>
          </div>
          <p class="desc">{{ item.desc }}</p>
          <div class="price-action">
            <div class="price-box">
              <span class="price">¥{{ calculatePrice(item.price).toLocaleString() }}</span>
              <del v-if="isPromoVersion" class="original-price">¥{{ item.price.toLocaleString() }}</del>
            </div>
            <div class="btn-group" @click.stop>
              <CommonButton size="small" type="primary" @click="handleAddToCart(item)">
                + 加购
              </CommonButton>
              <CommonButton size="small" type="default" @click="goToDetail(item.id)">
                详情 ❯
              </CommonButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import CommonButton from 'mainApp/CommonButton';
import { authService, bridgeService, globalEventBus } from 'mainApp/utils';

declare const __APP_VERSION__: string;
const currentAppVer = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v1.1.0';
const isPromoVersion = computed(() => currentAppVer === 'v1.1.0');

const calculatePrice = (basePrice: number) => {
  return isPromoVersion.value ? Math.round(basePrice * 0.8) : basePrice;
};

const router = useRouter();
const userInfo = ref(authService.getUserInfo());

const products = ref([
  {
    id: '1',
    name: 'iPhone 16 Pro Max (256G)',
    desc: '超强钛金属边框，A18 Pro 芯片，微前端畅爽体验',
    price: 9999,
    icon: '📱'
  },
  {
    id: '2',
    name: 'AirPods Max 2 代降噪耳机',
    desc: '主子应用高保真音频传输，无损空间音频',
    price: 3999,
    icon: '🎧'
  },
  {
    id: '3',
    name: 'MacBook Pro 16寸 M3 Max',
    desc: '全栈微前端高性能开发利器，秒级构建',
    price: 24999,
    icon: '💻'
  }
]);

const goToDetail = (id: string) => {
  // 🌟 子应用内部路由跳转
  router.push(`/mall/detail/${id}`);
};

const handleAddToCart = (item: any) => {
  globalEventBus.emit('cart:add', { item, count: 1 });
  bridgeService.showToast(`[商城] 已将《${item.name}》加入购物车`, 'success');
  bridgeService.vibrate();
};
</script>

<style scoped>
.mall-list-container {
  padding: 12px;
}
.route-badge-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px dashed rgba(56, 189, 248, 0.4);
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.route-tag {
  color: #38bdf8;
  font-family: monospace;
  font-weight: 600;
  font-size: 13px;
}
.tip-text {
  color: #94a3b8;
  font-size: 11px;
}
.feature-tip-mini {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #cbd5e1;
}
.user-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.user-name {
  color: #38bdf8;
}
.vip-tag {
  background: #f59e0b;
  color: #000;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
}
.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.product-card {
  display: flex;
  align-items: center;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.product-card:active {
  transform: scale(0.98);
  border-color: #38bdf8;
}
.product-icon {
  font-size: 36px;
}
.product-info {
  flex: 1;
}
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title-row h4 {
  margin: 0;
  font-size: 15px;
  color: #f8fafc;
}
.badge-hot {
  font-size: 10px;
  background: #ef4444;
  color: #fff;
  padding: 1px 4px;
  border-radius: 4px;
}
.desc {
  margin: 4px 0 8px;
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.3;
}
.price-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price-box {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.price {
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
}
.original-price {
  font-size: 11px;
  color: #64748b;
  text-decoration: line-through;
}
.btn-group {
  display: flex;
  gap: 6px;
}

/* 多版本与促销特别样式 */
.version-indicator-bar {
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 12px;
  font-size: 11px;
  transition: all 0.3s ease;
}
.bar-promo {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15));
  border: 1px solid rgba(239, 68, 68, 0.4);
}
.bar-stable {
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.3);
}
.ver-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.ver-badge {
  font-weight: 700;
  color: #f8fafc;
}
.ver-status {
  font-weight: 600;
  color: #f59e0b;
}
.ver-note {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.4;
  font-size: 10px;
}
.badge-promo {
  font-size: 10px;
  font-weight: 700;
  background: linear-gradient(90deg, #ef4444, #f59e0b);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
