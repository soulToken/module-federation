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
            <span class="badge-hot">热卖</span>
          </div>
          <p class="desc">{{ item.desc }}</p>
          <div class="price-action">
            <span class="price">¥{{ item.price.toLocaleString() }}</span>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import CommonButton from 'mainApp/CommonButton';
import { authService, bridgeService, globalEventBus } from 'mainApp/utils';

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
.price {
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
}
.btn-group {
  display: flex;
  gap: 6px;
}
</style>
