<template>
  <div class="hyper-user-card">
    <div class="card-badge">用户中心暴露卡片 · hyperUser/UserCard</div>
    <div class="card-body">
      <div class="avatar">🤖</div>
      <div class="user-meta">
        <div class="user-name-line">
          <strong>{{ user.nickname }}</strong>
          <span class="vip-pill">{{ user.role }}</span>
        </div>
        <div class="user-sub">
          <span>积分: <strong class="points">{{ points }}</strong></span>
          <span class="uid">UID: {{ user.userId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { authService, hyperEventBus } from '@hyper/core';

const user = ref(authService.getUserInfo());
const points = ref(user.value.points);

onMounted(() => {
  hyperEventBus.on('points:update', (delta: number) => {
    points.value += delta;
  });
});
</script>

<style scoped>
.hyper-user-card {
  background: #1e293b;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
  margin: 10px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
.card-badge {
  font-size: 11px;
  color: #38bdf8;
  font-weight: 600;
  margin-bottom: 6px;
  display: inline-block;
  background: rgba(56, 189, 248, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}
.card-body {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  font-size: 28px;
  background: #0f172a;
  border-radius: 50%;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.user-meta {
  flex: 1;
}
.user-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.user-name-line strong {
  font-size: 14px;
  color: #f8fafc;
}
.vip-pill {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 9999px;
  background: #f59e0b;
  color: #000;
  font-weight: bold;
}
.user-sub {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 3px;
}
.points {
  color: #f59e0b;
}
.uid {
  color: #64748b;
}
</style>
