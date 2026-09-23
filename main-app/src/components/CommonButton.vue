<template>
  <button
    class="common-btn"
    :class="[
      `btn-${type}`,
      `btn-${size}`,
      { 'is-loading': loading, 'is-block': block, 'is-disabled': disabled }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="spinner"></span>
    <span class="btn-text">
      <slot>{{ text }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text?: string;
    type?: 'primary' | 'success' | 'warning' | 'danger';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
  }>(),
  {
    text: '确认',
    type: 'primary',
    size: 'medium',
    loading: false,
    disabled: false,
    block: false
  }
);

const emit = defineEmits(['click']);

const handleClick = (e: MouseEvent) => {
  if (props.disabled || props.loading) return;
  emit('click', e);
};
</script>

<style scoped>
.common-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease-in-out;
  position: relative;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.common-btn:active:not(:disabled) {
  transform: scale(0.97);
  filter: brightness(0.9);
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-medium {
  padding: 10px 18px;
  font-size: 14px;
}

.btn-large {
  padding: 14px 24px;
  font-size: 16px;
  border-radius: 10px;
}

.is-block {
  display: flex;
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.35);
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.35);
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  box-shadow: 0 3px 10px rgba(245, 158, 11, 0.35);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  box-shadow: 0 3px 10px rgba(239, 68, 68, 0.35);
}

.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none !important;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
