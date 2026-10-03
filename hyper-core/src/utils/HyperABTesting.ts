/**
 * @hyper/core - 确定性一致性 Hash A/B 测试与分流评估引擎
 */

export interface ABBucket {
  group: 'A' | 'B' | string;
  name: string;
  version: string;
  weight: number; // 0..100
  tag?: string;
  badgeColor?: string;
  color?: string;
}

export interface ABExperiment {
  id: string;
  name: string;
  enabled: boolean;
  metric?: string;
  description?: string;
  buckets: ABBucket[];
}

export interface ABEvaluation {
  inExperiment: boolean;
  experiment?: ABExperiment;
  group: string;
  groupName?: string;
  version: string;
  score: number;
  bucket?: ABBucket;
  visitorId: string;
  isForced: boolean;
}

export class HyperABTesting {
  /**
   * 32 位 Murmur-like 确定性字符串散列算法
   */
  public static hash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * 核心评定：根据访客标识与实验策略，确定性分流 (防版本反复跳变与闪烁)
   */
  public static evaluate(
    visitorId: string,
    appId: string,
    exp: ABExperiment | undefined,
    defaultVersion: string,
    forcedGroup?: string
  ): ABEvaluation {
    if (!exp || !exp.enabled || !exp.buckets?.length) {
      return {
        inExperiment: false,
        group: 'control',
        version: defaultVersion,
        score: 0,
        visitorId,
        isForced: false,
      };
    }

    // 1. 优先检查开发调试强制指定 (入参指定 或 URL 参数如 ?hyperMall_ab=B)
    let urlOverrideGroup = forcedGroup;
    if (!urlOverrideGroup && typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      urlOverrideGroup =
        search.get(`${appId}_ab`) ||
        search.get(`${appId}_group`) ||
        search.get('ab_group') ||
        undefined;
    }

    if (urlOverrideGroup && urlOverrideGroup.toUpperCase() !== 'AUTO') {
      const matched = exp.buckets.find(
        b => b.group.toUpperCase() === urlOverrideGroup!.toUpperCase()
      );
      if (matched) {
        return {
          inExperiment: true,
          experiment: exp,
          group: matched.group,
          groupName: matched.name,
          version: matched.version,
          score: -1,
          bucket: matched,
          visitorId,
          isForced: true,
        };
      }
    }

    // 2. 确定性 Hash 计算：Hash(visitorId:experimentId) % 100
    const seed = `${visitorId}:${exp.id}`;
    const score = this.hash(seed) % 100;

    let cumulative = 0;
    let selected = exp.buckets[0];
    for (const b of exp.buckets) {
      cumulative += b.weight;
      if (score < cumulative) {
        selected = b;
        break;
      }
    }

    return {
      inExperiment: true,
      experiment: exp,
      group: selected.group,
      groupName: selected.name,
      version: selected.version,
      score,
      bucket: selected,
      visitorId,
      isForced: false,
    };
  }
}
