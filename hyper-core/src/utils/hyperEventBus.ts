/**
 * @hyper/core - 去中心化分布式事件总线 (HyperEventBus)
 * 支持对等微应用跨应用、跨构建上下文低延迟双向通信
 */

export type HyperEventHandler = (payload?: any) => void;

export class HyperEventBus {
  private channels = new Map<string, Set<HyperEventHandler>>();

  public on(channel: string, handler: HyperEventHandler): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(handler);
    return () => this.off(channel, handler);
  }

  public off(channel: string, handler: HyperEventHandler): void {
    this.channels.get(channel)?.delete(handler);
  }

  public emit(channel: string, payload?: any): void {
    const handlers = this.channels.get(channel);
    if (!handlers || handlers.size === 0) return;
    handlers.forEach(fn => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[HyperEventBus] Exception in channel "${channel}":`, err);
      }
    });
  }
}

// 保证在任何对等应用加载时，共享 window.__HYPER_EVENT_BUS__ 全局单例
const GLOBAL_KEY = '__HYPER_EVENT_BUS__';
if (typeof window !== 'undefined' && !(window as any)[GLOBAL_KEY]) {
  (window as any)[GLOBAL_KEY] = new HyperEventBus();
}

export const hyperEventBus: HyperEventBus =
  typeof window !== 'undefined' ? (window as any)[GLOBAL_KEY] : new HyperEventBus();
