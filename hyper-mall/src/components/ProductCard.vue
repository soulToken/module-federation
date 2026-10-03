<template>
  <div class="hyper-product-card">
    <div class="card-badge">微商城暴露组件 · hyperMall/ProductCard</div>
    <div class="card-content">
      <div class="prod-icon">{{ product.icon || '🛍️' }}</div>
      <div class="prod-detail">
        <h4>{{ product.name || 'iPhone 16 Pro Max' }}</h4>
        <p class="prod-desc">{{ product.desc || '由 hyper-mall 模块联邦对等暴露的原子卡片组件' }}</p>
        <div class="price-row">
          <span class="price">¥{{ (product.price || 9999).toLocaleString() }}</span>
          <button class="buy-btn" @click="handleAddToCart">
            + 立即加购
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { authService, bridgeService, hyperEventBus } from '@hyper/core';

const props = withDefaults(defineProps<{
  product?: {
    id?: string;
    name?: string;
    desc?: string;
    price?: number;
    icon?: string;
  };
}>(), {
  product: () => ({
    id: 'exp-01',
    name: 'iPhone 16 Pro Max 模块联邦限定款',
    desc: '来自 hyper-mall 独立仓库的商品组件，可在任意对等端就地嵌入',
    price: 9999,
    icon: '📱'
  })
});

function handleAddToCart() {
  hyperEventBus.emit('cart:add', { item: props.product, count: 1 });
  bridgeService.showToast(`[hyper-mall] 已将《${props.product.name}》加入购物车`, 'success');
  bridgeService.vibrate();
}
</script>

<style scoped>
.hyper-product-card {
  background: #1e293b;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 14px;
  margin: 12px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}
.card-badge {
  font-size: 11px;
  color: #38bdf8;
  font-weight: 600;
  margin-bottom: 8px;
  display: inline-block;
  background: rgba(56, 189, 248, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}
.card-content {
  display: flex;
  gap: 12px;
  align-items: center;
}
.prod-icon {
  font-size: 36px;
}
.prod-detail {
  flex: 1;
}
.prod-detail h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #f8fafc;
}
.prod-desc {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #94a3b8;
}
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price {
  font-size: 15px;
  font-weight: bold;
  color: #38bdf8;
}
.buy-btn {
  background: #0ea5e9;
  color: #fff;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.buy-btn:hover {
  background: #0284c7;
}
</style>
