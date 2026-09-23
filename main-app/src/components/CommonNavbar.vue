<template>
  <header class="common-navbar">
    <div class="navbar-left" @click="handleBack">
      <span v-if="showBack" class="back-icon">‹</span>
      <span v-if="backText" class="back-text">{{ backText }}</span>
    </div>
    <div class="navbar-title">
      <span class="title-text">{{ title }}</span>
      <span v-if="subBadge" class="title-badge">{{ subBadge }}</span>
    </div>
    <div class="navbar-right">
      <slot name="right">
        <button v-if="rightActionText" class="right-btn" @click="$emit('right-click')">
          {{ rightActionText }}
        </button>
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    showBack?: boolean;
    backText?: string;
    subBadge?: string;
    rightActionText?: string;
  }>(),
  {
    showBack: true,
    backText: '返回',
    subBadge: '',
    rightActionText: ''
  }
);

const emit = defineEmits(['back', 'right-click']);

const handleBack = () => {
  emit('back');
};
</script>

<style scoped>
.common-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.navbar-left {
  display: flex;
  align-items: center;
  cursor: pointer;
  min-width: 60px;
  color: #38bdf8;
  font-size: 14px;
}

.back-icon {
  font-size: 26px;
  line-height: 1;
  margin-right: 2px;
  margin-top: -2px;
}

.navbar-title {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.title-badge {
  font-size: 10px;
  padding: 2px 6px;
  margin-left: 6px;
  background: #ef4444;
  color: #fff;
  border-radius: 10px;
  font-weight: normal;
}

.navbar-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 60px;
}

.right-btn {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.right-btn:active {
  transform: scale(0.95);
  background: rgba(56, 189, 248, 0.3);
}
</style>
