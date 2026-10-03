import { ref } from 'vue';
import { HyperABTesting, ABExperiment, ABEvaluation } from './HyperABTesting';

export interface PeerAppVersionMeta {
  version: string;
  entry: string;
  releasedAt?: string;
  description?: string;
  tag?: string;
  badgeColor?: string;
}

export interface PeerAppConfig {
  id: string;
  name: string;
  moduleName: string;
  exposePath: string;
  icon?: string;
  devEntry: string;
  versions: Record<string, PeerAppVersionMeta>;
}

export interface CanaryConfig {
  enabled: boolean;
  canaryVersion: string;
  baselineVersion: string;
  whitelistUsers?: string[];
  trafficRatio?: number; // 0..100
}

export interface RegistryManifest {
  name: string;
  version: string;
  updatedAt: string;
  activeVersions: Record<string, string>;
  apps: Record<string, PeerAppConfig>;
  canary?: Record<string, CanaryConfig>;
  experiments?: Record<string, ABExperiment>;
}

export const DEFAULT_REGISTRY: RegistryManifest = {
  name: 'hyper-decentralized-registry',
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  activeVersions: {
    hyperMall: 'v1.1.0',
    hyperActivity: 'v1.1.0',
    hyperUser: 'v1.0.0',
  },
  apps: {
    hyperMall: {
      id: 'hyperMall',
      name: '微商城对等应用',
      moduleName: 'hyperMall',
      exposePath: './MallPage',
      icon: '🛍️',
      devEntry: 'http://localhost:3001/remoteEntry.js',
      versions: {
        'v1.0.0': {
          version: 'v1.0.0',
          entry: '/apps/hyper-mall/v1.0.0/remoteEntry.js',
          releasedAt: '2026-09-20 10:00:00',
          tag: '经典稳定版',
          description: '经典商品瀑布流、基础加购与结算',
          badgeColor: 'gray',
        },
        'v1.1.0': {
          version: 'v1.1.0',
          entry: '/apps/hyper-mall/v1.1.0/remoteEntry.js',
          releasedAt: '2026-10-01 08:00:00',
          tag: '大促特惠版',
          description: '全场限时 8 折秒杀、大促横幅与优惠角标',
          badgeColor: 'green',
        },
      },
    },
    hyperActivity: {
      id: 'hyperActivity',
      name: '营销活动对等应用',
      moduleName: 'hyperActivity',
      exposePath: './ActivityPage',
      icon: '🎡',
      devEntry: 'http://localhost:3002/remoteEntry.js',
      versions: {
        'v1.0.0': {
          version: 'v1.0.0',
          entry: '/apps/hyper-activity/v1.0.0/remoteEntry.js',
          releasedAt: '2026-09-20 10:00:00',
          tag: '经典稳定版',
          description: '基础转盘抽奖、积分常规消耗',
          badgeColor: 'gray',
        },
        'v1.1.0': {
          version: 'v1.1.0',
          entry: '/apps/hyper-activity/v1.1.0/remoteEntry.js',
          releasedAt: '2026-10-01 08:00:00',
          tag: '狂欢翻倍版',
          description: '黄金周狂欢特别版、特等奖奖池膨胀 100% 翻倍',
          badgeColor: 'orange',
        },
      },
    },
    hyperUser: {
      id: 'hyperUser',
      name: '用户中心对等应用',
      moduleName: 'hyperUser',
      exposePath: './UserPage',
      icon: '👤',
      devEntry: 'http://localhost:3003/remoteEntry.js',
      versions: {
        'v1.0.0': {
          version: 'v1.0.0',
          entry: '/apps/hyper-user/v1.0.0/remoteEntry.js',
          releasedAt: '2026-09-20 10:00:00',
          tag: '会员基准版',
          description: '个人资产、积分明细与订单流',
          badgeColor: 'gray',
        },
      },
    },
  },
  canary: {
    hyperMall: {
      enabled: true,
      canaryVersion: 'v1.1.0',
      baselineVersion: 'v1.0.0',
      whitelistUsers: ['hyper_tester_01', 'hyper_vip_99'],
      trafficRatio: 30,
    },
  },
  experiments: {
    hyperMall: {
      id: 'exp_hyper_mall_2026',
      name: '微商城 8折秒杀版 A/B 转化率实验',
      enabled: true,
      metric: '商品加购率 & 客单价',
      buckets: [
        { group: 'A', name: '对照组 A (经典版)', version: 'v1.0.0', weight: 50, tag: '稳定基线', badgeColor: 'gray' },
        { group: 'B', name: '实验组 B (大促版)', version: 'v1.1.0', weight: 50, tag: '8折秒杀', badgeColor: 'green' },
      ],
    },
    hyperActivity: {
      id: 'exp_hyper_act_2026',
      name: '营销活动 100% 暴击翻倍 A/B 实验',
      enabled: false,
      metric: '抽奖活跃度 & 积分消耗',
      buckets: [
        { group: 'A', name: '对照组 A (经典轮盘)', version: 'v1.0.0', weight: 70, tag: '标准概率', badgeColor: 'gray' },
        { group: 'B', name: '实验组 B (暴击狂欢)', version: 'v1.1.0', weight: 30, tag: '翻倍暴击', badgeColor: 'orange' },
      ],
    },
  },
};

const STORAGE_KEY_OVERRIDES = '__HYPER_OVERRIDES__';
const STORAGE_KEY_AB_OVERRIDES = '__HYPER_AB_OVERRIDES__';
const STORAGE_KEY_VISITOR_ID = '__HYPER_VISITOR_ID__';

export class HyperRemoteResolver {
  public registry = ref<RegistryManifest>(DEFAULT_REGISTRY);
  public overrides = ref<Record<string, string>>({});
  public abOverrides = ref<Record<string, string>>({});
  public visitorId = ref<string>('');
  public exposureLogs = ref<Array<{ time: string; appId: string; group: string; version: string; visitorId: string }>>([]);

  private containerCache = new Map<string, any>();
  private versionChangeListeners: Array<(appId: string, version: string) => void> = [];

  constructor() {
    this.initVisitorId();
    this.loadOverridesFromStorage();
    this.fetchRemoteRegistry();
  }

  // 1. 初始化访客设备标识
  private initVisitorId() {
    if (typeof window === 'undefined') return;
    try {
      let vid = localStorage.getItem(STORAGE_KEY_VISITOR_ID);
      if (!vid) {
        vid = `hyper_v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(STORAGE_KEY_VISITOR_ID, vid);
      }
      this.visitorId.value = vid;
    } catch {
      this.visitorId.value = 'hyper_v_default';
    }
  }

  public getVisitorId(): string {
    return this.visitorId.value || 'hyper_v_default';
  }

  public resetVisitorId(): string {
    const newId = `hyper_v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    this.visitorId.value = newId;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_VISITOR_ID, newId);
      } catch {}
    }
    // 通知全网对等端刷新
    for (const appId of Object.keys(this.registry.value.apps)) {
      this.notifyListeners(appId, this.resolveTargetVersion(appId));
    }
    return newId;
  }

  // 2. 本地存储持久化与读取
  private loadOverridesFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (saved) this.overrides.value = JSON.parse(saved);
      const savedAb = localStorage.getItem(STORAGE_KEY_AB_OVERRIDES);
      if (savedAb) this.abOverrides.value = JSON.parse(savedAb);
    } catch {}
  }

  private saveOverridesToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(this.overrides.value));
      localStorage.setItem(STORAGE_KEY_AB_OVERRIDES, JSON.stringify(this.abOverrides.value));
    } catch {}
  }

  // 3. 拉取最新的去中心化注册清单
  public async fetchRemoteRegistry(): Promise<RegistryManifest> {
    try {
      const res = await fetch(`/hyper-registry.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        this.registry.value = data;
      }
    } catch (e) {
      console.warn('[HyperRemoteResolver] 网络清单拉取失败，使用默认清单兜底:', e);
    }
    return this.registry.value;
  }

  // 4. 规范化 AppId
  public normalizeAppId(key: string): string {
    const lower = key.toLowerCase();
    if (lower === 'mall' || lower === 'hypermall') return 'hyperMall';
    if (lower === 'activity' || lower === 'hyperactivity') return 'hyperActivity';
    if (lower === 'user' || lower === 'hyperuser') return 'hyperUser';
    return key;
  }

  // 5. 评定 A/B 实验命中情况
  public evaluateExperiment(appId: string): ABEvaluation {
    const exp = this.registry.value.experiments?.[appId];
    const defaultVer = this.registry.value.activeVersions[appId] || 'v1.0.0';
    const forced = this.abOverrides.value[appId];

    return HyperABTesting.evaluate(this.getVisitorId(), appId, exp, defaultVer, forced);
  }

  // 6. 决策目标微应用版本 (优先级: 本地版本强指定 > URL覆盖 > A/B实验 > 白名单灰度 > 默认版本)
  public resolveTargetVersion(appId: string): string {
    const normId = this.normalizeAppId(appId);

    // 优先级 1: 开发者面板明确手动锁定版本
    if (this.overrides.value[normId]) {
      return this.overrides.value[normId];
    }

    // 优先级 2: URL 显式覆盖 (例如 ?hyperMall_ver=v1.0.0)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlVer = params.get(`${normId}_ver`) || params.get(`${normId.replace(/^hyper/, '').toLowerCase()}_ver`);
      if (urlVer) return urlVer;
    }

    // 优先级 3: A/B 实验分桶 (若启用)
    const expResult = this.evaluateExperiment(normId);
    if (expResult.inExperiment) {
      return expResult.version;
    }

    // 优先级 4: 灰度切流 (Canary 白名单 / 流量比)
    const canary = this.registry.value.canary?.[normId];
    if (canary && canary.enabled) {
      const vid = this.getVisitorId();
      if (canary.whitelistUsers?.includes(vid)) {
        return canary.canaryVersion;
      }
      if (canary.trafficRatio && canary.trafficRatio > 0) {
        const hashScore = HyperABTesting.hash(`${vid}:${normId}:canary`) % 100;
        if (hashScore < canary.trafficRatio) {
          return canary.canaryVersion;
        }
      }
    }

    // 优先级 5: 清单默认生产版本
    return this.registry.value.activeVersions[normId] || 'v1.0.0';
  }

  // 7. 曝光埋点上报
  public trackExposure(appId: string) {
    const normId = this.normalizeAppId(appId);
    const expResult = this.evaluateExperiment(normId);
    if (!expResult.inExperiment) return;

    const logItem = {
      time: new Date().toLocaleTimeString(),
      appId: normId,
      group: expResult.group,
      version: expResult.version,
      visitorId: expResult.visitorId,
    };

    const first = this.exposureLogs.value[0];
    if (!first || first.appId !== normId || first.group !== logItem.group) {
      this.exposureLogs.value.unshift(logItem);
      if (this.exposureLogs.value.length > 20) this.exposureLogs.value.pop();
      console.log(
        `%c[hyper A/B 曝光]%c ${normId} 命中 [${expResult.groupName || expResult.group}] 版本: ${expResult.version} (Hash: ${expResult.score})`,
        'background:#10b981;color:white;font-weight:bold;padding:2px 6px;border-radius:4px;',
        'color:#10b981;font-weight:bold;'
      );
    }
  }

  // 8. 核心方法：加载对等微应用模块 (含 Circuit Breaker 熔断降级)
  public async loadPeerModule<T = any>(appId: string, exposePath?: string): Promise<T> {
    const normId = this.normalizeAppId(appId);
    await this.fetchRemoteRegistry();

    const appConfig = this.registry.value.apps[normId];
    if (!appConfig) {
      throw new Error(`[HyperRemoteResolver] 未注册的对等应用: ${normId}`);
    }

    const version = this.resolveTargetVersion(normId);
    const verInfo = appConfig.versions[version];

    // 上报 A/B 实验曝光
    this.trackExposure(normId);

    // 区分生产与开发环境入口
    const isProd = typeof window !== 'undefined' && location.hostname !== 'localhost';
    const entryUrl = isProd
      ? (verInfo ? verInfo.entry : appConfig.devEntry)
      : appConfig.devEntry;

    const finalUrl = `${entryUrl}?v=${encodeURIComponent(version)}`;
    console.log(`[HyperRemoteResolver] 🚀 装载对等应用 [${appConfig.name}] -> 版本: ${version} 地址: ${finalUrl}`);

    try {
      let container = this.containerCache.get(finalUrl);
      if (!container) {
        container = await import(/* @vite-ignore */ finalUrl);
        this.containerCache.set(finalUrl, container);
      }

      // 获取当前运行时的共享单例 scope
      const instances = (window as any).__FEDERATION__?.__INSTANCES__ || [];
      const firstInstance = instances[0];
      const shareScope = firstInstance?.shareScopeMap?.default || {};

      if (typeof container.init === 'function') {
        try {
          await container.init(shareScope);
        } catch {}
      }

      const targetPath = exposePath || appConfig.exposePath;
      const factory = await container.get(targetPath);
      const moduleExports = typeof factory === 'function' ? factory() : factory;
      return (moduleExports?.default || moduleExports) as T;
    } catch (err) {
      console.error(`[HyperRemoteResolver] ⚠️ 加载 ${normId} (${version}) 失败，触发熔断降级兜底`, err);
      // 熔断降级到基线 v1.0.0
      if (version !== 'v1.0.0' && appConfig.versions['v1.0.0']) {
        console.warn(`[HyperRemoteResolver] 尝试降级至稳定基线版本 v1.0.0...`);
        const fallbackUrl = `${appConfig.versions['v1.0.0'].entry}?v=v1.0.0`;
        const fallbackContainer = await import(/* @vite-ignore */ fallbackUrl);
        const factory = await fallbackContainer.get(exposePath || appConfig.exposePath);
        const moduleExports = typeof factory === 'function' ? factory() : factory;
        return (moduleExports?.default || moduleExports) as T;
      }
      throw err;
    }
  }

  // 9. 开发者调控 API
  public switchVersion(appId: string, version: string) {
    const normId = this.normalizeAppId(appId);
    delete this.abOverrides.value[normId];
    this.overrides.value[normId] = version;
    this.saveOverridesToStorage();
    this.notifyListeners(normId, version);
  }

  public setAbOverride(appId: string, groupOrAuto: string) {
    const normId = this.normalizeAppId(appId);
    delete this.overrides.value[normId];
    if (groupOrAuto.toUpperCase() === 'AUTO') {
      delete this.abOverrides.value[normId];
    } else {
      this.abOverrides.value[normId] = groupOrAuto.toUpperCase();
    }
    this.saveOverridesToStorage();
    this.notifyListeners(normId, this.resolveTargetVersion(normId));
  }

  public resetOverrides(appId?: string) {
    if (appId) {
      const normId = this.normalizeAppId(appId);
      delete this.overrides.value[normId];
      delete this.abOverrides.value[normId];
      this.notifyListeners(normId, this.resolveTargetVersion(normId));
    } else {
      this.overrides.value = {};
      this.abOverrides.value = {};
      for (const id of Object.keys(this.registry.value.apps)) {
        this.notifyListeners(id, this.resolveTargetVersion(id));
      }
    }
    this.saveOverridesToStorage();
  }

  public onVersionChange(cb: (appId: string, version: string) => void) {
    this.versionChangeListeners.push(cb);
  }

  private notifyListeners(appId: string, version: string) {
    for (const cb of this.versionChangeListeners) {
      try {
        cb(appId, version);
      } catch (e) {
        console.error('[HyperRemoteResolver] Listener error:', e);
      }
    }
  }
}

export const hyperRemoteResolver = new HyperRemoteResolver();
