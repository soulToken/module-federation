/**
 * 微前端跨应用路由与返回协同桥接服务 (Route Bridge Service)
 * 
 * 核心解决：
 * 1. 混合模式架构：支持“有独立多级路由的子应用”与“无独立路由的单页子应用”共存；
 * 2. 统一出栈顺序：统一管理顶部公共导航栏 ‹ 返回 按钮与浏览器物理返回键；
 * 3. 智能路由判断：
 *    - 子应用在多级页面内部（如商品详情、积分记录）：优先子应用内部 router.back()
 *    - 子应用退无可退（处于子应用首页）或无独立路由：自动协同退回主应用基座门户首页
 */

export type BackHandler = () => boolean;

export interface SubAppRouteState {
  name: string;
  currentPath: string;
  canGoBack: boolean;
  backHandler?: BackHandler;
}

const subAppRouteMap: Map<string, SubAppRouteState> = new Map();
let activeSubAppName: string | null = null;

type NavigationListener = (target: string, payload?: any) => void;
const navigationListeners: Set<NavigationListener> = new Set();

type StateChangeListener = (info: { activeSubApp: string | null; subAppRoute?: SubAppRouteState }) => void;
const stateChangeListeners: Set<StateChangeListener> = new Set();

function normalizeName(name?: string | null): string {
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lower.startsWith('sub')) {
    return lower.slice(3);
  }
  return lower;
}

function notifyStateChange() {
  const currentKey = activeSubAppName ? normalizeName(activeSubAppName) : null;
  const info = {
    activeSubApp: activeSubAppName,
    subAppRoute: currentKey ? subAppRouteMap.get(currentKey) : undefined
  };
  stateChangeListeners.forEach(listener => {
    try {
      listener(info);
    } catch (e) {
      console.error('[routeBridge] state change listener error', e);
    }
  });
}

export const routeBridge = {
  /**
   * 判断某个子应用是否具备独立路由系统
   */
  isRoutedSubApp(name: string | null): boolean {
    if (!name) return false;
    const norm = normalizeName(name);
    return norm === 'mall' || norm === 'user';
  },

  /**
   * 设置当前处于激活状态的子应用标识
   */
  setActiveSubApp(name: string | null) {
    activeSubAppName = name;
    notifyStateChange();
  },

  /**
   * 获取当前激活的子应用标识
   */
  getActiveSubApp(): string | null {
    return activeSubAppName;
  },

  /**
   * 获取指定子应用的路由状态
   */
  getSubAppRoute(name?: string | null): SubAppRouteState | undefined {
    if (!name) return undefined;
    return subAppRouteMap.get(normalizeName(name));
  },

  /**
   * 子应用注册其路由后退处理器与状态
   */
  registerSubAppRoute(name: string, state: Partial<SubAppRouteState>) {
    const key = normalizeName(name);
    const existing = subAppRouteMap.get(key) || { name: key, currentPath: '/', canGoBack: false };
    if (state.backHandler) existing.backHandler = state.backHandler;
    if (typeof state.currentPath === 'string') existing.currentPath = state.currentPath;
    if (typeof state.canGoBack === 'boolean') existing.canGoBack = state.canGoBack;
    subAppRouteMap.set(key, existing);
    notifyStateChange();
  },

  /**
   * 子应用通知主应用自身的路由状态变化
   */
  updateSubAppRoute(name: string, path: string, canGoBack: boolean) {
    const key = normalizeName(name);
    const existing = subAppRouteMap.get(key) || { name: key, currentPath: '/', canGoBack: false };
    existing.currentPath = path;
    existing.canGoBack = canGoBack;
    subAppRouteMap.set(key, existing);
    notifyStateChange();
  },

  /**
   * 监听路由状态变化
   */
  onStateChange(listener: StateChangeListener) {
    stateChangeListeners.add(listener);
    return () => stateChangeListeners.delete(listener);
  },

  /**
   * 智能后退：
   * @returns true 表示已被子应用内部路由消费并后退；false 表示子应用无法后退（应由主应用切回门户）
   */
  navigateBack(): boolean {
    if (activeSubAppName) {
      const key = normalizeName(activeSubAppName);
      if (subAppRouteMap.has(key)) {
        const info = subAppRouteMap.get(key)!;
        // 如果子应用内部有路由且可后退
        if (info.canGoBack && typeof info.backHandler === 'function') {
          const handled = info.backHandler();
          if (handled) return true;
        }
      }
    }

    // 只有在子应用独立脱离基座运行（无 window.__MF_MAIN_APP__ 且处于独立窗口）时，才回退浏览器原生 history
    const isStandaloneSubApp = typeof window !== 'undefined' && !(window as any).__MF_MAIN_APP__;
    if (isStandaloneSubApp && window.history.length > 1) {
      window.history.back();
      return true;
    }

    return false;
  },

  /**
   * 跨应用跳转
   */
  navigateTo(target: string, payload?: any) {
    navigationListeners.forEach(listener => listener(target, payload));
    if (typeof window !== 'undefined' && window.location) {
      // 同步到浏览器 hash，方便用户刷新与复制链接
      window.location.hash = target.startsWith('/') ? target : `/${target}`;
    }
  },

  /**
   * 订阅跳转事件
   */
  onNavigate(listener: NavigationListener) {
    navigationListeners.add(listener);
    return () => navigationListeners.delete(listener);
  }
};

if (typeof window !== 'undefined') {
  (window as any).__ROUTE_BRIDGE__ = routeBridge;
  (window as any).__SUB_APP_ROUTES__ = subAppRouteMap;
}


