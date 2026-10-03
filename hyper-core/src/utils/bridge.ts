/**
 * 主应用移动端 JSBridge 与系统级交互能力
 * 封装在主应用，子应用无需重复实现，直接调用即可触发原生级动效
 * 
 * 🌟 核心特性：
 * 1. 嵌入主应用时：优先通过监听器派发至主应用基座统一管理 UI 浮层
 * 2. 子应用独立访问时：自动启用自包含 (Self-Contained) 的 DOM 降级渲染，无缝生效
 */

export interface ToastOptions {
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  duration?: number;
}

export type ToastListener = (opts: ToastOptions) => void;
const toastListeners: Set<ToastListener> = new Set();

let standaloneToastEl: HTMLElement | null = null;
let standaloneTimer: any = null;

function renderStandaloneToast(opts: ToastOptions) {
  if (typeof document === 'undefined') return;

  if (!standaloneToastEl) {
    standaloneToastEl = document.createElement('div');
    standaloneToastEl.className = 'standalone-global-toast';
    document.body.appendChild(standaloneToastEl);

    // 动态注入轻量优雅的 Toast 样式
    if (!document.getElementById('standalone-toast-style')) {
      const style = document.createElement('style');
      style.id = 'standalone-toast-style';
      style.textContent = `
        .standalone-global-toast {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.9);
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(10px);
          color: #f8fafc;
          padding: 12px 24px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 99999;
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .standalone-global-toast.show {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        .standalone-toast-icon {
          font-size: 16px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  };

  const icon = icons[opts.type || 'info'] || 'ℹ️';
  standaloneToastEl.innerHTML = `<span class="standalone-toast-icon">${icon}</span><span>${opts.message}</span>`;
  standaloneToastEl.classList.add('show');

  if (standaloneTimer) clearTimeout(standaloneTimer);
  standaloneTimer = setTimeout(() => {
    if (standaloneToastEl) {
      standaloneToastEl.classList.remove('show');
    }
  }, opts.duration || 2500);
}

export const bridgeService = {
  /**
   * 触发全局 Toast 提示
   * 无论嵌入主应用还是独立运行，均可立即生效
   */
  showToast(message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info', duration = 2500) {
    const opts: ToastOptions = { message, type, duration };

    if (toastListeners.size > 0) {
      // 宿主模式：主应用统一接管渲染
      toastListeners.forEach(listener => listener(opts));
    } else {
      // 独立运行模式：自包含 DOM 兜底渲染
      renderStandaloneToast(opts);
    }

    console.log(`[Bridge] 弹出Toast: [${type.toUpperCase()}] ${message}`);
  },

  /**
   * 模拟调用客户端/微信分享
   */
  callNativeShare(shareData: { title: string; desc: string; link: string }) {
    this.showToast(`已调用客户端原生分享: 《${shareData.title}》`, 'success');
  },

  /**
   * 模拟移动端轻微触感震动
   */
  vibrate() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    console.log('[Bridge] 触发硬件触感震动');
  },

  // 内部监听器供主应用 UI 接管弹窗
  _subscribeToast(listener: ToastListener) {
    toastListeners.add(listener);
    return () => toastListeners.delete(listener);
  }
};
