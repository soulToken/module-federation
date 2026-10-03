<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="visible" class="common-modal-mask" @click.self="handleMaskClick">
        <div class="common-modal-container">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <span class="modal-close" @click="handleClose">✕</span>
          </div>
          <div class="modal-body">
            <slot>{{ content }}</slot>
          </div>
          <div class="modal-footer">
            <button v-if="showCancel" class="modal-btn btn-cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="modal-btn btn-confirm" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    visible: boolean;
    title?: string;
    content?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    maskClosable?: boolean;
  }>(),
  {
    title: '系统提示',
    content: '',
    confirmText: '确认',
    cancelText: '取消',
    showCancel: true,
    maskClosable: true
  }
);

const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'close']);

const handleClose = () => {
  emit('update:visible', false);
  emit('close');
};

const handleMaskClick = () => {
  if (props.maskClosable) {
    handleClose();
  }
};

const handleCancel = () => {
  emit('update:visible', false);
  emit('cancel');
};

const handleConfirm = () => {
  emit('confirm');
};
</script>

<style scoped>
.common-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
}

.common-modal-container {
  width: 100%;
  max-width: 320px;
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
  overflow: hidden;
  animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 10px;
}

.modal-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #f8fafc;
}

.modal-close {
  cursor: pointer;
  color: #94a3b8;
  font-size: 16px;
}

.modal-body {
  padding: 10px 20px 18px;
  font-size: 14px;
  line-height: 1.5;
  color: #cbd5e1;
}

.modal-footer {
  display: flex;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-btn {
  flex: 1;
  padding: 14px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel {
  color: #94a3b8;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-confirm {
  color: #38bdf8;
  font-weight: 600;
}

.modal-btn:active {
  background: rgba(255, 255, 255, 0.05);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes modal-pop {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
