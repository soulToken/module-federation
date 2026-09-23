/**
 * 主应用移动端 JSBridge 与系统级交互能力
 * 封装在主应用，子应用无需重复实现，直接调用即可触发主应用原生级动效
 */

export interface ToastOptions {
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  duration?: number;
}

export type ToastListener = (opts: ToastOptions) => void;
const toastListeners: Set<ToastListener> = new Set();

export const bridgeService = {
  /**
   * 触发主应用全局 Toast 提示
   */
  showToast(message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info', duration = 2500) {
    const opts: ToastOptions = { message, type, duration };
    toastListeners.forEach(listener => listener(opts));
    console.log(`[MainApp Bridge] 弹出Toast: [${type.toUpperCase()}] ${message}`);
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
    console.log('[MainApp Bridge] 触发硬件触感震动');
  },

  // 内部监听器供主应用 UI 呈现弹窗
  _subscribeToast(listener: ToastListener) {
    toastListeners.add(listener);
    return () => toastListeners.delete(listener);
  }
};
