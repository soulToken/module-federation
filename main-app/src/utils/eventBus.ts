/**
 * 全局微前端跨应用事件总线 (EventBus)
 * 允许子应用向主应用或其他子应用派发事件
 */

type Handler = (payload: any) => void;

class GlobalEventBus {
  private events: Map<string, Set<Handler>> = new Map();

  on(eventName: string, handler: Handler) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName)!.add(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName: string, handler: Handler) {
    const handlers = this.events.get(eventName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(eventName: string, payload?: any) {
    console.log(`[MainApp EventBus] 广播事件 "${eventName}":`, payload);
    const handlers = this.events.get(eventName);
    if (handlers) {
      handlers.forEach(fn => fn(payload));
    }
  }
}

export const globalEventBus = new GlobalEventBus();
