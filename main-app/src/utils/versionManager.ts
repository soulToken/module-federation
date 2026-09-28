import { ref, reactive, computed } from 'vue';

export interface VersionItem {
  version: string;
  entry: string;
  releasedAt: string;
  description: string;
  tag: string;
  badgeColor?: string;
}

export interface AppConfig {
  id: string;
  name: string;
  moduleName: string;
  exposePath: string;
  icon: string;
  devEntry: string;
  versions: Record<string, VersionItem>;
}

export interface ExperimentBucket {
  group: string;
  name: string;
  version: string;
  weight: number;
  tag?: string;
  badgeColor?: string;
  color?: string;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  metric?: string;
  buckets: ExperimentBucket[];
}

export interface ExperimentEvaluationResult {
  inExperiment: boolean;
  experiment?: ExperimentConfig;
  group?: string;
  groupName?: string;
  version: string;
  hashScore?: number; // 0..99
  bucket?: ExperimentBucket;
  isManualOverride: boolean;
  visitorId: string;
}

export interface VersionManifest {
  name: string;
  version: string;
  updatedAt: string;
  activeVersions: Record<string, string>;
  apps: Record<string, AppConfig>;
  experiments?: Record<string, ExperimentConfig>;
}

// 默认基线清单配置（在离线或本地加载异常时作为安全兜底）
export const DEFAULT_MANIFEST: VersionManifest = {
  name: 'h5-module-federation-registry',
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  activeVersions: {
    subMall: 'v1.1.0',
    subActivity: 'v1.1.0',
    subUser: 'v1.0.0'
  },
  apps: {
    subMall: {
      id: 'subMall',
      name: '微商城子应用',
      moduleName: 'subAppMall',
      exposePath: './MallPage',
      icon: '🛍️',
      devEntry: 'http://localhost:3001/remoteEntry.js',
      versions: {
        'v1.0.0': {
          version: 'v1.0.0',
          entry: '/apps/mall/v1.0.0/remoteEntry.js',
          releasedAt: '2026-09-27 15:00:00',
          description: '经典稳定版：标准商品卡片、独立多级路由与购物车',
          tag: '生产稳定版',
          badgeColor: 'gray'
        },
        'v1.1.0': {
          version: 'v1.1.0',
          entry: '/apps/mall/v1.1.0/remoteEntry.js',
          releasedAt: '2026-09-28 06:30:00',
          description: '大促特惠版：全场限时 8 折秒杀、热销大促横幅与优惠角标',
          tag: '线上最新版',
          badgeColor: 'green'
        }
      }
    },
    subActivity: {
      id: 'subActivity',
      name: '营销活动子应用',
      moduleName: 'subAppActivity',
      exposePath: './ActivityPage',
      icon: '🎡',
      devEntry: 'http://localhost:3002/remoteEntry.js',
      versions: {
        'v1.0.0': {
          version: 'v1.0.0',
          entry: '/apps/activity/v1.0.0/remoteEntry.js',
          releasedAt: '2026-09-27 15:00:00',
          description: '经典幸运轮盘：基础积分消耗与标准概率奖池',
          tag: '生产稳定版',
          badgeColor: 'gray'
        },
        'v1.1.0': {
          version: 'v1.1.0',
          entry: '/apps/activity/v1.1.0/remoteEntry.js',
          releasedAt: '2026-09-28 06:30:00',
          description: '黄金周嘉年华狂欢版：中奖率 100% 翻倍暴击、特等奖奖池膨胀',
          tag: '线上最新版',
          badgeColor: 'green'
        }
      }
    },
    subUser: {
      id: 'subUser',
      name: '用户中心子应用',
      moduleName: 'subAppUser',
      exposePath: './UserPage',
      icon: '👤',
      devEntry: 'http://localhost:3003/remoteEntry.js',
      versions: {
        'v1.0.0': {
          version: 'v1.0.0',
          entry: '/apps/user/v1.0.0/remoteEntry.js',
          releasedAt: '2026-09-27 15:00:00',
          description: '会员基准版：用户信息展示、积分流水与通用组件复用',
          tag: '生产稳定版',
          badgeColor: 'gray'
        }
      }
    }
  },
  experiments: {
    subMall: {
      id: 'exp_mall_promo_2026',
      name: '微商城 8折大促加购转化率 A/B 实验',
      enabled: true,
      description: '对比原价稳定基线版 (A组) 与限时 8 折大促特惠版 (B组) 的加购与客单表现',
      metric: '商品加购转化率 & 订单客单价',
      buckets: [
        {
          group: 'A',
          name: '对照组 A (经典稳定版)',
          version: 'v1.0.0',
          weight: 50,
          tag: '稳定基线',
          badgeColor: 'gray',
          color: '#64748b'
        },
        {
          group: 'B',
          name: '实验组 B (大促特惠版)',
          version: 'v1.1.0',
          weight: 50,
          tag: '8折秒杀',
          badgeColor: 'green',
          color: '#10b981'
        }
      ]
    },
    subActivity: {
      id: 'exp_activity_carnival_2026',
      name: '营销活动 100% 翻倍暴击 A/B 实验',
      enabled: false,
      description: '测试黄金周狂欢翻倍主题对用户每日参与抽奖与积分消耗频次的影响',
      metric: '抽奖参与率 & 积分活跃度',
      buckets: [
        {
          group: 'A',
          name: '对照组 A (经典轮盘)',
          version: 'v1.0.0',
          weight: 70,
          tag: '常规概率',
          badgeColor: 'gray',
          color: '#8b5cf6'
        },
        {
          group: 'B',
          name: '实验组 B (翻倍暴击)',
          version: 'v1.1.0',
          weight: 30,
          tag: '暴击狂欢',
          badgeColor: 'orange',
          color: '#f59e0b'
        }
      ]
    }
  }
};

const STORAGE_KEY = 'MF_ACTIVE_VERSION_OVERRIDES';
const VISITOR_ID_KEY = 'MF_VISITOR_ID';
const AB_OVERRIDES_KEY = 'MF_AB_OVERRIDES';

class VersionManager {
  private manifest = ref<VersionManifest>(DEFAULT_MANIFEST);
  private overrides = ref<Record<string, string>>({});
  private abOverrides = ref<Record<string, string>>({}); // appId -> 'A' | 'B' | 'auto'
  private visitorId = ref<string>('');
  private loadedContainers = new Map<string, any>();
  private versionChangeListeners: Array<(appId: string, version: string) => void> = [];
  public exposureLogs = ref<Array<{ time: string; appId: string; appName: string; group: string; version: string; visitorId: string }>>([]);

  constructor() {
    this.initVisitorId();
    this.loadOverridesFromStorage();
    this.parseUrlOverrides();
    this.fetchRemoteManifest();
  }

  // 1. 初始化访客身份（用于一致性 Hash 分流）
  private initVisitorId() {
    if (typeof window === 'undefined') return;
    try {
      let id = localStorage.getItem(VISITOR_ID_KEY);
      if (!id) {
        id = `visitor_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem(VISITOR_ID_KEY, id);
      }
      this.visitorId.value = id;
    } catch (e) {
      this.visitorId.value = 'visitor_default';
    }
  }

  public getVisitorId(): string {
    return this.visitorId.value || 'visitor_default';
  }

  // 重新生成访客 ID，模拟全新用户进站
  public resetVisitorId(): string {
    const newId = `visitor_${Math.random().toString(36).substring(2, 8)}`;
    this.visitorId.value = newId;
    try {
      localStorage.setItem(VISITOR_ID_KEY, newId);
    } catch (e) {
      // ignore
    }
    // 重新分流通知
    for (const appId of Object.keys(this.manifest.value.apps)) {
      this.notifyListeners(appId, this.getActiveVersion(appId));
    }
    return newId;
  }

  // 2. 本地存储持久化与读取
  private loadOverridesFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.overrides.value = JSON.parse(saved);
      }
      const savedAb = localStorage.getItem(AB_OVERRIDES_KEY);
      if (savedAb) {
        this.abOverrides.value = JSON.parse(savedAb);
      }
    } catch (e) {
      console.warn('[VersionManager] Failed to load overrides from localStorage', e);
    }
  }

  private saveOverridesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.overrides.value));
      localStorage.setItem(AB_OVERRIDES_KEY, JSON.stringify(this.abOverrides.value));
    } catch (e) {
      console.warn('[VersionManager] Failed to save overrides to localStorage', e);
    }
  }

  // 3. URL 参数识别（例如 ?subMall_ver=v1.0.0 或 ?subMall_ab=A）
  private parseUrlOverrides() {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of params.entries()) {
        if (key.endsWith('_ver') || key.endsWith('_version')) {
          const appKey = key.replace(/_(ver|version)$/, '');
          const appId = this.normalizeAppId(appKey);
          this.overrides.value[appId] = value;
        } else if (key.endsWith('_ab') || key.endsWith('_group')) {
          const appKey = key.replace(/_(ab|group)$/, '');
          const appId = this.normalizeAppId(appKey);
          this.abOverrides.value[appId] = value.toUpperCase();
        }
      }
    } catch (e) {
      // ignore
    }
  }

  private normalizeAppId(key: string): string {
    const lower = key.toLowerCase();
    if (lower === 'mall' || lower === 'submall') return 'subMall';
    if (lower === 'activity' || lower === 'subactivity') return 'subActivity';
    if (lower === 'user' || lower === 'subuser') return 'subUser';
    return key;
  }

  // 4. 从服务端拉取最新 version-manifest.json
  public async fetchRemoteManifest(): Promise<VersionManifest> {
    try {
      const res = await fetch(`/version-manifest.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        this.manifest.value = data;
      }
    } catch (e) {
      console.warn('[VersionManager] Using fallback manifest due to network error:', e);
    }
    return this.manifest.value;
  }

  // 5. 确定性哈希算法 (Murmur-like 字符串正整数哈希)
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // 6. 核心：评估 A/B 实验分流命中结果
  public evaluateExperiment(appId: string): ExperimentEvaluationResult {
    const exp = this.manifest.value.experiments?.[appId];
    const defaultVer = this.manifest.value.activeVersions[appId] || 'v1.0.0';
    const currentVisitor = this.getVisitorId();

    if (!exp || !exp.enabled || !exp.buckets || exp.buckets.length === 0) {
      return {
        inExperiment: false,
        version: defaultVer,
        isManualOverride: false,
        visitorId: currentVisitor
      };
    }

    // 检查人工强制指定实验组 (URL 参数或开发者面板指定)
    const manualGroup = this.abOverrides.value[appId];
    if (manualGroup && manualGroup !== 'AUTO') {
      const matchedBucket = exp.buckets.find(b => b.group.toUpperCase() === manualGroup.toUpperCase());
      if (matchedBucket) {
        return {
          inExperiment: true,
          experiment: exp,
          group: matchedBucket.group,
          groupName: matchedBucket.name,
          version: matchedBucket.version,
          bucket: matchedBucket,
          isManualOverride: true,
          visitorId: currentVisitor
        };
      }
    }

    // 确定性哈希计算 (0 ~ 99)
    const hashScore = this.hashString(`${currentVisitor}:${exp.id}`) % 100;
    let cumulative = 0;
    let hitBucket = exp.buckets[0];

    for (const b of exp.buckets) {
      cumulative += b.weight;
      if (hashScore < cumulative) {
        hitBucket = b;
        break;
      }
    }

    return {
      inExperiment: true,
      experiment: exp,
      group: hitBucket.group,
      groupName: hitBucket.name,
      version: hitBucket.version,
      hashScore,
      bucket: hitBucket,
      isManualOverride: false,
      visitorId: currentVisitor
    };
  }

  // 7. 获取当前生效的版本号 (决策顺序: 本地强制版本覆写 > A/B 实验计算结果 > Manifest 官方默认)
  public getActiveVersion(appId: string): string {
    // 优先级 1: 开发者面板明确手动回滚/切换到指定版本
    if (this.overrides.value[appId]) {
      return this.overrides.value[appId];
    }

    // 优先级 2: A/B 实验分流（如果该应用启用了实验）
    const expResult = this.evaluateExperiment(appId);
    if (expResult.inExperiment) {
      return expResult.version;
    }

    // 优先级 3: Manifest 官方线上统一激活版本
    return this.manifest.value.activeVersions[appId] || 'v1.0.0';
  }

  // 8. 埋点：上报实验曝光
  public trackExperimentExposure(appId: string) {
    const expResult = this.evaluateExperiment(appId);
    if (!expResult.inExperiment) return;

    const appConfig = this.getAppConfig(appId);
    const logItem = {
      time: new Date().toLocaleTimeString(),
      appId,
      appName: appConfig?.name || appId,
      group: expResult.group || 'A',
      version: expResult.version,
      visitorId: expResult.visitorId
    };

    // 避免重复连续上报
    const last = this.exposureLogs.value[0];
    if (!last || last.appId !== appId || last.group !== logItem.group || last.visitorId !== logItem.visitorId) {
      this.exposureLogs.value.unshift(logItem);
      if (this.exposureLogs.value.length > 20) {
        this.exposureLogs.value.pop();
      }
      console.log(
        `%c[A/B 实验分流曝光]%c ${logItem.appName} 命中 [${expResult.groupName}] 版本: ${expResult.version} (Hash分值: ${expResult.hashScore ?? '强制'})`,
        'background:#10b981;color:white;font-weight:bold;padding:2px 6px;border-radius:4px;',
        'color:#10b981;font-weight:bold;'
      );
    }
  }

  // 9. 开发者 A/B 调试功能：强制切换指定实验组
  public setAppAbOverride(appId: string, groupOrAuto: string) {
    // 清除普通版本的特定 override，以 A/B 分流设置为准
    delete this.overrides.value[appId];

    if (groupOrAuto.toUpperCase() === 'AUTO') {
      delete this.abOverrides.value[appId];
    } else {
      this.abOverrides.value[appId] = groupOrAuto.toUpperCase();
    }
    this.saveOverridesToStorage();
    this.notifyListeners(appId, this.getActiveVersion(appId));
  }

  public getAppAbOverride(appId: string): string | undefined {
    return this.abOverrides.value[appId];
  }

  // 10. 动态开关 A/B 实验
  public toggleExperiment(appId: string, enabled?: boolean) {
    if (!this.manifest.value.experiments?.[appId]) return;
    const current = this.manifest.value.experiments[appId].enabled;
    this.manifest.value.experiments[appId].enabled = enabled !== undefined ? enabled : !current;
    this.notifyListeners(appId, this.getActiveVersion(appId));
  }

  // 11. 动态调节实验流量权重 (例如 50:50 -> 20:80)
  public updateExperimentWeights(appId: string, weights: { [group: string]: number }) {
    const exp = this.manifest.value.experiments?.[appId];
    if (!exp) return;
    for (const bucket of exp.buckets) {
      if (weights[bucket.group] !== undefined) {
        bucket.weight = weights[bucket.group];
      }
    }
    this.notifyListeners(appId, this.getActiveVersion(appId));
  }

  // 12. 判断当前应用是否处于“人工介入/本地覆写”状态
  public isOverridden(appId: string): boolean {
    if (this.overrides.value[appId]) return true;
    if (this.abOverrides.value[appId]) return true;
    return false;
  }

  // 13. 获取当前应用的清单详情
  public getAppConfig(appId: string): AppConfig | undefined {
    return this.manifest.value.apps[appId];
  }

  // 14. 获取整个清单（响应式）
  public getManifest() {
    return this.manifest;
  }

  // 15. 切换/一键回滚版本
  public switchVersion(appId: string, targetVersion: string) {
    // 清除 A/B 组强制覆盖，以指定版本为主
    delete this.abOverrides.value[appId];
    this.overrides.value[appId] = targetVersion;
    this.saveOverridesToStorage();
    this.notifyListeners(appId, targetVersion);
  }

  // 16. 恢复到线上 Manifest 官方默认状态（清除版本覆写和 A/B 锁定）
  public resetToManifestDefault(appId?: string) {
    if (appId) {
      delete this.overrides.value[appId];
      delete this.abOverrides.value[appId];
    } else {
      this.overrides.value = {};
      this.abOverrides.value = {};
    }
    this.saveOverridesToStorage();
    if (appId) {
      this.notifyListeners(appId, this.getActiveVersion(appId));
    } else {
      for (const id of Object.keys(this.manifest.value.apps)) {
        this.notifyListeners(id, this.getActiveVersion(id));
      }
    }
  }

  public onVersionChange(callback: (appId: string, version: string) => void) {
    this.versionChangeListeners.push(callback);
  }

  private notifyListeners(appId: string, version: string) {
    for (const listener of this.versionChangeListeners) {
      try {
        listener(appId, version);
      } catch (e) {
        console.error('[VersionManager] Listener error:', e);
      }
    }
  }

  // 17. 🌟 核心：根据动态版本加载远程 Remote 模块
  public async loadRemoteComponent(appId: string): Promise<any> {
    await this.fetchRemoteManifest();
    const appConfig = this.getAppConfig(appId);
    if (!appConfig) {
      throw new Error(`[VersionManager] Unregistered app: ${appId}`);
    }

    const version = this.getActiveVersion(appId);
    const verInfo = appConfig.versions[version];

    // 上报 A/B 实验曝光埋点
    this.trackExperimentExposure(appId);

    // 判断是开发环境还是生产环境
    const isProd = import.meta.env.PROD;
    let entryUrl = isProd
      ? (verInfo ? verInfo.entry : appConfig.devEntry)
      : appConfig.devEntry;

    // 加上版本戳规避浏览器旧缓存
    const finalUrl = `${entryUrl}?v=${encodeURIComponent(version)}`;

    console.log(`[VersionManager] 🚀 动态加载微应用 [${appConfig.name}] -> 版本: ${version} 地址: ${finalUrl}`);

    let container = this.loadedContainers.get(finalUrl);
    if (!container) {
      container = await import(/* @vite-ignore */ finalUrl);
      this.loadedContainers.set(finalUrl, container);
    }

    // 初始化共享依赖单例 (Vue、Pinia 等)
    const instances = (window as any).__FEDERATION__?.__INSTANCES__ || [];
    const hostInstance = instances.find((inst: any) => inst.options?.name === 'mainApp') || instances[0];
    const shareScope = hostInstance?.shareScopeMap?.default || {};

    if (typeof container.init === 'function') {
      try {
        await container.init(shareScope);
      } catch (e) {
        // Module Federation 容器如果已接入当前 Scope，无需二次报错
      }
    }

    const factory = await container.get(appConfig.exposePath);
    const moduleExports = typeof factory === 'function' ? factory() : factory;
    return moduleExports?.default || moduleExports;
  }
}

export const versionManager = new VersionManager();
