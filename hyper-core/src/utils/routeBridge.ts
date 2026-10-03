/**
 * 微前端跨应用路由与返回协同桥接服务 (Route Bridge Service)
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
  if (lower.startsWith('hyper')) {
    return lower.slice(5);
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
  isRoutedSubApp(name: string | null): boolean {
    if (!name) return false;
    const norm = normalizeName(name);
    return norm === 'mall' || norm === 'user';
  },

  setActiveSubApp(name: string | null) {
    activeSubAppName = name;
    notifyStateChange();
  },

  getActiveSubApp(): string | null {
    return activeSubAppName;
  },

  getSubAppRoute(name?: string | null): SubAppRouteState | undefined {
    if (!name) return undefined;
    return subAppRouteMap.get(normalizeName(name));
  },

  registerSubAppRoute(name: string, state: Partial<SubAppRouteState>) {
    const key = normalizeName(name);
    const existing = subAppRouteMap.get(key) || { name: key, currentPath: '/', canGoBack: false };
    if (state.backHandler) existing.backHandler = state.backHandler;
    if (typeof state.currentPath === 'string') existing.currentPath = state.currentPath;
    if (typeof state.canGoBack === 'boolean') existing.canGoBack = state.canGoBack;
    subAppRouteMap.set(key, existing);
    notifyStateChange();
  },

  updateSubAppRoute(name: string, path: string, canGoBack: boolean) {
    const key = normalizeName(name);
    const existing = subAppRouteMap.get(key) || { name: key, currentPath: '/', canGoBack: false };
    existing.currentPath = path;
    existing.canGoBack = canGoBack;
    subAppRouteMap.set(key, existing);
    notifyStateChange();
  },

  onStateChange(listener: StateChangeListener) {
    stateChangeListeners.add(listener);
    return () => stateChangeListeners.delete(listener);
  },

  navigateBack(): boolean {
    if (activeSubAppName) {
      const key = normalizeName(activeSubAppName);
      if (subAppRouteMap.has(key)) {
        const info = subAppRouteMap.get(key)!;
        if (info.canGoBack && typeof info.backHandler === 'function') {
          const handled = info.backHandler();
          if (handled) return true;
        }
      }
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return true;
    }

    return false;
  },

  navigateTo(target: string, payload?: any) {
    navigationListeners.forEach(listener => listener(target, payload));
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = target.startsWith('/') ? target : `/${target}`;
    }
  },

  onNavigate(listener: NavigationListener) {
    navigationListeners.add(listener);
    return () => navigationListeners.delete(listener);
  }
};

if (typeof window !== 'undefined') {
  (window as any).__ROUTE_BRIDGE__ = routeBridge;
  (window as any).__SUB_APP_ROUTES__ = subAppRouteMap;
}
