<template>
  <div class="desktop-wrapper">
    <!-- 桌面端侧边提示面板 (大屏展示调试信息与直达链接) -->
    <aside class="dev-sidebar">
      <div class="sidebar-card">
        <div class="badge">Module Federation 2.0 模块联邦</div>
        <h2>架构与调试看板</h2>
        <p class="desc">
          当前结构：<strong>1 个主应用门户 + 3 个独立微应用</strong>。<br/>
          主应用作为 Host 统一管理全局登录态、Toast 与公共基础库。
        </p>

        <div class="info-group">
          <h3>主应用全局状态 (Reactive State)</h3>
          <div class="info-row">
            <span>当前登录用户:</span>
            <strong>{{ currentUser.nickname }}</strong>
          </div>
          <div class="info-row">
            <span>身份等级:</span>
            <span class="tag-vip">{{ currentUser.role }}</span>
          </div>
          <div class="info-row">
            <span>全局积分:</span>
            <strong class="text-orange">{{ userPoints }} 分</strong>
          </div>
          <div class="info-row">
            <span>购物车总件数:</span>
            <strong class="text-green">{{ cartCount }} 件</strong>
          </div>
        </div>

        <div class="info-group">
          <h3>代码引用模式</h3>
          <div class="code-box">
            <code>
              // 子应用中直接写：<br/>
              import CommonNavbar from 'mainApp/CommonNavbar';<br/>
              import CommonButton from 'mainApp/CommonButton';<br/>
              import { authService, bridgeService } from 'mainApp/utils';
            </code>
          </div>
        </div>

        <div class="info-group">
          <h3>微前端路由与智能返回控制台 (Hybrid Router)</h3>
          <div class="route-status-card">
            <div class="route-row">
              <span>当前全局路由:</span>
              <strong class="route-highlight">{{ currentRoutePath }}</strong>
            </div>
            <div class="route-row">
              <span>激活子应用:</span>
              <span class="text-cyan">{{ currentRemoteLabel || '主应用门户首页' }}</span>
            </div>
            <div class="route-row">
              <span>路由架构类型:</span>
              <span :class="['subapp-pill', isSubAppWithRouter ? 'pill-green' : 'pill-yellow']">
                {{ currentTab === 'home' ? '🏠 宿主根应用' : isSubAppWithRouter ? '⚡ 具备独立多级路由 (subMall / subUser)' : '📦 纯单页组件无独立路由 (subActivity)' }}
              </span>
            </div>
            <div class="route-row">
              <span>是否可内部后退:</span>
              <span :class="canSubAppGoBack ? 'text-green' : 'text-gray'">
                {{ canSubAppGoBack ? '✓ 是 (子应用内部出栈)' : '✕ 否 (已在首页，后退直达基座)' }}
              </span>
            </div>
          </div>

          <div class="router-btn-grid">
            <button class="action-route-btn" @click="jumpTo('/mall/detail/1')">
              🛍️ 跳转商城详情: iPhone 16
            </button>
            <button class="action-route-btn" @click="jumpTo('/mall/detail/2')">
              🎧 跳转商城详情: AirPods
            </button>
            <button class="action-route-btn" @click="jumpTo('/user/points')">
              💎 跳转用户中心: 积分明细
            </button>
            <button class="action-route-btn" @click="jumpTo('/activity')">
              🎡 跳转营销活动 (无路由)
            </button>
            <button class="action-back-btn" @click="handleHostBack">
              ‹ 模拟点击后退 (智能协同出栈)
            </button>
          </div>
        </div>

        <div class="info-group">
          <h3>独立子应用端口直达</h3>
          <div class="port-links">
            <a href="http://localhost:3001" target="_blank" class="port-btn">
              🛒 商城子应用 (:3001) ↗
            </a>
            <a href="http://localhost:3002" target="_blank" class="port-btn">
              🎁 活动子应用 (:3002) ↗
            </a>
            <a href="http://localhost:3003" target="_blank" class="port-btn">
              👤 用户子应用 (:3003) ↗
            </a>
          </div>
        </div>

        <div class="info-group">
          <h3>移动端控制</h3>
          <button class="switch-phone-btn" @click="togglePhoneFrame">
            {{ isPhoneFrame ? '切换为流式全屏视图' : '切换为 iPhone 模拟机框' }}
          </button>
        </div>
      </div>
    </aside>

    <!-- 移动端视口主应用容器 -->
    <main class="mobile-viewport" :class="{ 'phone-frame': isPhoneFrame }">
      <!-- 手机听筒/摄像头刘海 (模拟机框时显示) -->
      <div v-if="isPhoneFrame" class="phone-notch">
        <div class="notch-speaker"></div>
        <div class="notch-camera"></div>
      </div>

      <!-- 主应用移动端顶栏 (状态指示) -->
      <div class="h5-master-header">
        <div class="status-indicator">
          <button v-if="currentTab !== 'home' || canSubAppGoBack" class="header-back-chip" @click="handleHostBack">
            ‹ 返回
          </button>
          <span class="live-dot"></span>
          <span class="status-text">{{ currentTabTitle }}</span>
        </div>
        <div class="master-right">
          <span class="cart-pill">🛒 {{ cartCount }}</span>
          <span class="points-pill">💎 {{ userPoints }}</span>
        </div>
      </div>

      <!-- 内容渲染区 -->
      <div class="sub-apps-container">
        <!-- Tab 0: 主应用自有首页门户 (打开默认展示) -->
        <div v-if="currentTab === 'home'" class="main-home-view">
          <CommonNavbar
            title="主应用门户 (Main App)"
            :show-back="false"
            right-action-text="Toast"
            @right-click="testHostToast"
          />

          <div class="home-scroll-body">
            <!-- 欢迎 Banner -->
            <div class="portal-banner">
              <span class="portal-tag">🏢 主应用基座专属页面</span>
              <h2>微前端 H5 综合门户</h2>
              <p>主应用统一管理公共方法与公共组件，各业务子应用按需接入</p>
            </div>

            <!-- 金刚区快捷导航 (直达三个子应用) -->
            <div class="nav-grid-box">
              <div class="nav-grid-item" @click="switchTab('mall')">
                <div class="grid-icon bg-blue">🛍️</div>
                <span class="grid-label">微商城</span>
                <span class="grid-sub">子应用 1</span>
              </div>
              <div class="nav-grid-item" @click="switchTab('activity')">
                <div class="grid-icon bg-purple">🎡</div>
                <span class="grid-label">福利大转盘</span>
                <span class="grid-sub">子应用 2</span>
              </div>
              <div class="nav-grid-item" @click="switchTab('user')">
                <div class="grid-icon bg-emerald">👤</div>
                <span class="grid-label">会员中心</span>
                <span class="grid-sub">子应用 3</span>
              </div>
            </div>

            <!-- 主应用公共组件调试面板 -->
            <div class="section-card">
              <div class="card-header">
                <h3>🧩 主应用暴露的公共组件预览</h3>
                <span class="badge-mini">exposes</span>
              </div>
              <p class="section-desc">以下组件由主应用编写，子应用直接通过 import 使用：</p>
              
              <div class="component-demo-list">
                <div class="demo-row">
                  <span class="demo-name">CommonButton 交互测试:</span>
                  <div class="btn-group">
                    <CommonButton size="small" type="primary" @click="testBtnClick('主要操作')">主要按钮</CommonButton>
                    <CommonButton size="small" type="warning" @click="testBtnClick('警告操作')">警示按钮</CommonButton>
                  </div>
                </div>

                <div class="demo-row">
                  <span class="demo-name">CommonModal 弹窗测试:</span>
                  <CommonButton size="small" type="success" @click="showDemoModal = true">打开主应用弹窗</CommonButton>
                </div>
              </div>
            </div>

            <!-- 主应用公共方法调试面板 -->
            <div class="section-card">
              <div class="card-header">
                <h3>🛠️ 主应用暴露的公共方法测试</h3>
                <span class="badge-mini">utils</span>
              </div>
              <div class="method-test-grid">
                <button class="method-btn" @click="triggerAddPoints">
                  <span>💎 积分 +50</span>
                  <small>authService.updatePoints()</small>
                </button>
                <button class="method-btn" @click="triggerShare">
                  <span>📢 调起客户端分享</span>
                  <small>bridgeService.callNativeShare()</small>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 1 ~ 3: 动态载入对应远程子应用 -->
        <div v-else class="remote-sub-app-wrapper">
          <div class="remote-watermark">
            <span>🌐 正在运行：{{ currentRemoteLabel }}（模块联邦 Remote 动态引入）</span>
          </div>

          <Suspense>
            <template #default>
              <KeepAlive>
                <component :is="activeComponent" :key="currentTab" />
              </KeepAlive>
            </template>
            <template #fallback>
              <div class="mf-loading">
                <div class="spinner"></div>
                <span>正在从对应子应用端口拉取 Remote 模块...</span>
              </div>
            </template>
          </Suspense>
        </div>
      </div>

      <!-- 主应用移动端底部导航栏 (TabBar) -->
      <nav class="h5-tabbar">
        <div
          class="tab-item"
          :class="{ active: currentTab === 'home' }"
          @click="switchTab('home')"
        >
          <div class="tab-icon">🏠</div>
          <span class="tab-label">主页</span>
        </div>

        <div
          class="tab-item"
          :class="{ active: currentTab === 'mall' }"
          @click="switchTab('mall')"
        >
          <div class="tab-icon">
            🛍️
            <span v-if="cartCount > 0" class="badge-dot">{{ cartCount }}</span>
          </div>
          <span class="tab-label">商城</span>
        </div>

        <div
          class="tab-item"
          :class="{ active: currentTab === 'activity' }"
          @click="switchTab('activity')"
        >
          <div class="tab-icon">
            🎡
            <span class="badge-red-dot"></span>
          </div>
          <span class="tab-label">活动</span>
        </div>

        <div
          class="tab-item"
          :class="{ active: currentTab === 'user' }"
          @click="switchTab('user')"
        >
          <div class="tab-icon">👤</div>
          <span class="tab-label">我的</span>
        </div>
      </nav>

      <!-- 手机底部黑条 (Home Bar) -->
      <div v-if="isPhoneFrame" class="phone-home-indicator"></div>
    </main>

    <!-- 主应用演示弹窗 -->
    <CommonModal
      v-model:visible="showDemoModal"
      title="主应用全局 CommonModal"
      confirm-text="知道了"
      :show-cancel="false"
      @confirm="showDemoModal = false"
    >
      <div style="font-size: 13px; line-height: 1.6;">
        这是定义在主应用 <code>main-app/src/components/CommonModal.vue</code> 的弹窗。<br/>
        子应用无需重复编写 Modal 代码，直接 <code>import CommonModal from 'mainApp/CommonModal'</code> 即可唤起统一风格弹窗！
      </div>
    </CommonModal>

    <!-- 主应用全局 Toast 浮层 (由任一子应用调用主应用 bridge 时触发展示) -->
    <transition name="toast-pop">
      <div v-if="toast.visible" class="global-h5-toast" :class="`toast-${toast.type}`">
        <span class="toast-icon">{{ toastIcon }}</span>
        <span class="toast-msg">{{ toast.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, defineAsyncComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import CommonNavbar from './components/CommonNavbar.vue';
import CommonButton from './components/CommonButton.vue';
import CommonModal from './components/CommonModal.vue';
import { authService, bridgeService, globalEventBus, routeBridge, ToastOptions } from './utils';

const router = useRouter();
const route = useRoute();

// 视图控制
const isPhoneFrame = ref(true);
const togglePhoneFrame = () => {
  isPhoneFrame.value = !isPhoneFrame.value;
};

const showDemoModal = ref(false);

// 🌟 通过 Module Federation 动态异步加载 3 个远程子应用的页面级组件
const MallRemotePage = defineAsyncComponent(() => import('subMall/MallPage'));
const ActivityRemotePage = defineAsyncComponent(() => import('subActivity/ActivityPage'));
const UserRemotePage = defineAsyncComponent(() => import('subUser/UserPage'));

// 当前选中的 Tab，默认展示主应用自己的门户首页
const currentTab = ref<'home' | 'mall' | 'activity' | 'user'>('home');

// 路由与混合架构感知
const currentRoutePath = computed(() => route?.path || '/');
const isSubAppWithRouter = computed(() => routeBridge.isRoutedSubApp(currentTab.value));
const canSubAppGoBack = ref(false);

const refreshCanGoBack = () => {
  if (currentTab.value === 'home') {
    canSubAppGoBack.value = false;
    return;
  }
  const subRoute = routeBridge.getSubAppRoute(currentTab.value);
  canSubAppGoBack.value = Boolean(subRoute?.canGoBack);
};

// 监听子应用内部向 routeBridge 报告的状态变更
routeBridge.onStateChange((info) => {
  if (info.activeSubApp) {
    const routeState = routeBridge.getSubAppRoute(info.activeSubApp);
    canSubAppGoBack.value = Boolean(routeState?.canGoBack);
  } else {
    canSubAppGoBack.value = false;
  }
});

// 跳转方法
const jumpTo = (path: string) => {
  if (router) {
    router.push(path);
  } else {
    window.location.hash = path;
  }
};

// 智能返回处理
const handleHostBack = () => {
  // 1. 优先尝试由当前激活的子应用内部路由消化（例如商品详情页 -> 商品列表页）
  const handledInternally = routeBridge.navigateBack();
  if (!handledInternally) {
    // 2. 如果子应用无法后退（已在子应用根路径，或为无路由的单页活动应用），基座协同退回主应用基座门户首页
    if (currentTab.value !== 'home') {
      jumpTo('/home');
      bridgeService.showToast('已安全退回主应用门户首页', 'info');
    } else {
      bridgeService.showToast('当前已在主应用基座首页', 'warning');
    }
  }
};

// 切换底部 Tab
const switchTab = (tab: 'home' | 'mall' | 'activity' | 'user') => {
  currentTab.value = tab;
  if (tab === 'mall') jumpTo('/mall/list');
  else if (tab === 'activity') jumpTo('/activity');
  else if (tab === 'user') jumpTo('/user/home');
  else jumpTo('/home');
};

// 监听路由变化，同步 Tab 与激活子应用状态
watch(() => route?.path, (newPath) => {
  if (!newPath) return;
  if (newPath.startsWith('/mall')) {
    currentTab.value = 'mall';
    routeBridge.setActiveSubApp('mall');
  } else if (newPath.startsWith('/activity')) {
    currentTab.value = 'activity';
    routeBridge.setActiveSubApp('activity');
  } else if (newPath.startsWith('/user')) {
    currentTab.value = 'user';
    routeBridge.setActiveSubApp('user');
  } else {
    currentTab.value = 'home';
    routeBridge.setActiveSubApp(null);
  }
  refreshCanGoBack();
}, { immediate: true });

// 订阅跨应用导航请求
routeBridge.onNavigate((target) => {
  jumpTo(target);
});

const currentTabTitle = computed(() => {
  switch (currentTab.value) {
    case 'home': return '主应用基座 (Host: 3000)';
    case 'mall': return '商城子应用 (Remote: 3001)';
    case 'activity': return '营销活动子应用 (Remote: 3002)';
    case 'user': return '个人中心子应用 (Remote: 3003)';
  }
});

const currentRemoteLabel = computed(() => {
  switch (currentTab.value) {
    case 'mall': return '商城子应用 (subAppMall @ 3001)';
    case 'activity': return '营销活动子应用 (subAppActivity @ 3002)';
    case 'user': return '个人中心子应用 (subAppUser @ 3003)';
    default: return '';
  }
});

const activeComponent = computed(() => {
  switch (currentTab.value) {
    case 'mall': return MallRemotePage;
    case 'activity': return ActivityRemotePage;
    case 'user': return UserRemotePage;
    default: return null;
  }
});

// 主应用全局状态
const currentUser = ref(authService.getUserInfo());
const userPoints = ref(currentUser.value.points);
const cartCount = ref(2);

// 主应用操作演示
const testHostToast = () => {
  bridgeService.showToast('这是主应用自身触发的全局 Toast', 'info');
};

const testBtnClick = (action: string) => {
  bridgeService.showToast(`点击了主应用公共按钮：${action}`, 'success');
  bridgeService.vibrate();
};

const triggerAddPoints = () => {
  authService.updatePoints(50);
  userPoints.value = authService.getUserInfo().points;
  bridgeService.showToast('积分增加 50！', 'success');
};

const triggerShare = () => {
  bridgeService.callNativeShare({
    title: 'H5 微前端门户',
    desc: 'Module Federation 模块联邦演示',
    link: window.location.href
  });
};

// 主应用全局 Toast 状态
const toast = reactive({
  visible: false,
  message: '',
  type: 'info' as 'success' | 'warning' | 'info' | 'error'
});

const toastIcon = computed(() => {
  switch (toast.type) {
    case 'success': return '✓';
    case 'warning': return '⚠️';
    case 'error': return '✕';
    default: return 'ℹ';
  }
});

let toastTimer: any = null;
const triggerToast = (opts: ToastOptions) => {
  toast.message = opts.message;
  toast.type = opts.type || 'info';
  toast.visible = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.visible = false;
  }, opts.duration || 2500);
};

onMounted(() => {
  // 订阅主应用 JSBridge Toast 监听
  bridgeService._subscribeToast(triggerToast);

  // 监听所有子应用通过全局事件总线发送的事件
  globalEventBus.on('cart:add', (payload) => {
    cartCount.value += payload?.count || 1;
  });

  globalEventBus.on('points:update', (payload) => {
    userPoints.value = authService.getUserInfo().points;
  });
});
</script>

<style scoped>
.desktop-wrapper {
  display: flex;
  min-height: 100vh;
  background: radial-gradient(circle at top left, #1e1b4b, #090d16);
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 40px;
}

/* 侧边信息栏 */
.dev-sidebar {
  max-width: 380px;
}

.sidebar-card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  color: #e2e8f0;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 12px;
  margin-bottom: 12px;
}

.sidebar-card h2 {
  font-size: 20px;
  margin-bottom: 8px;
  color: #f8fafc;
}

.desc {
  font-size: 13px;
  line-height: 1.6;
  color: #94a3b8;
  margin-bottom: 20px;
}

.code-box {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 11px;
  color: #38bdf8;
  font-family: monospace;
  line-height: 1.5;
}

.info-group {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.info-group h3 {
  font-size: 13px;
  color: #cbd5e1;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
  color: #94a3b8;
}

.tag-vip {
  background: #f59e0b;
  color: #000;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.text-orange {
  color: #fb923c;
}

.text-green {
  color: #34d399;
}

.text-cyan {
  color: #38bdf8;
  font-weight: 600;
}

.text-gray {
  color: #64748b;
}

.route-status-card {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.route-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #94a3b8;
}

.route-highlight {
  color: #f59e0b;
  font-family: monospace;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.subapp-pill {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.pill-green {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.pill-yellow {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.router-btn-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.action-route-btn {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #bae6fd;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.action-route-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #fff;
}

.action-back-btn {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 8px;
  padding: 9px 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  margin-top: 4px;
  transition: all 0.2s;
}

.action-back-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
  color: #fff;
}

.header-back-chip {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 6px;
  transition: background 0.2s;
}

.header-back-chip:hover {
  background: rgba(255, 255, 255, 0.3);
}

.port-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port-btn {
  display: block;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #38bdf8;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  transition: all 0.2s;
}

.port-btn:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
}

.switch-phone-btn {
  width: 100%;
  padding: 10px;
  background: #334155;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.switch-phone-btn:hover {
  background: #475569;
}

/* 移动端视口 */
.mobile-viewport {
  width: 100%;
  max-width: 414px;
  height: 840px;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.phone-frame {
  border: 12px solid #2e384d;
  border-radius: 46px;
  box-shadow: 0 0 0 2px #1a2233, 0 30px 80px rgba(0, 0, 0, 0.8);
}

.phone-notch {
  width: 150px;
  height: 24px;
  background: #2e384d;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.notch-speaker {
  width: 40px;
  height: 4px;
  background: #111827;
  border-radius: 2px;
}

.notch-camera {
  width: 8px;
  height: 8px;
  background: #111827;
  border-radius: 50%;
}

.phone-home-indicator {
  width: 120px;
  height: 4px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 50;
}

/* 主应用顶栏 */
.h5-master-header {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  z-index: 10;
  padding-top: 4px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
}

.live-dot {
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

.master-right {
  display: flex;
  gap: 8px;
}

.cart-pill, .points-pill {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

/* 子应用/内容容器 */
.sub-apps-container {
  flex: 1;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  background: #090d16;
}

/* 主应用专属首页视图 */
.main-home-view {
  min-height: 100%;
}

.home-scroll-body {
  padding: 14px;
}

.portal-banner {
  background: linear-gradient(135deg, #1e3a8a, #0284c7);
  padding: 16px;
  border-radius: 14px;
  color: #fff;
  margin-bottom: 14px;
  box-shadow: 0 8px 20px rgba(2, 132, 199, 0.3);
}

.portal-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  font-size: 10px;
  border-radius: 8px;
}

.portal-banner h2 {
  font-size: 18px;
  margin: 6px 0 4px;
}

.portal-banner p {
  font-size: 11px;
  margin: 0;
  opacity: 0.9;
}

.nav-grid-box {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.nav-grid-item {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-grid-item:active {
  transform: scale(0.95);
  background: rgba(56, 189, 248, 0.15);
}

.grid-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 6px;
}

.bg-blue { background: rgba(59, 130, 246, 0.2); }
.bg-purple { background: rgba(168, 85, 247, 0.2); }
.bg-emerald { background: rgba(16, 185, 129, 0.2); }

.grid-label {
  font-size: 12px;
  font-weight: 600;
  color: #f1f5f9;
}

.grid-sub {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

.section-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-header h3 {
  margin: 0;
  font-size: 13px;
  color: #f8fafc;
}

.badge-mini {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  font-size: 10px;
  font-family: monospace;
  padding: 1px 6px;
  border-radius: 4px;
}

.section-desc {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.component-demo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.demo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  padding: 8px 10px;
  border-radius: 8px;
}

.demo-name {
  font-size: 11px;
  color: #cbd5e1;
}

.btn-group {
  display: flex;
  gap: 6px;
}

.method-test-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.method-btn {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.15s;
}

.method-btn:active {
  background: rgba(56, 189, 248, 0.2);
}

.method-btn span {
  font-size: 12px;
  font-weight: 500;
}

.method-btn small {
  font-size: 10px;
  color: #64748b;
  font-family: monospace;
  margin-top: 2px;
}

/* 远程微应用容器标识 */
.remote-sub-app-wrapper {
  min-height: 100%;
}

.remote-watermark {
  background: rgba(99, 102, 241, 0.15);
  border-bottom: 1px solid rgba(99, 102, 241, 0.3);
  padding: 6px 12px;
  font-size: 11px;
  color: #818cf8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  font-size: 13px;
  color: #94a3b8;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 主应用底部 TabBar */
.h5-tabbar {
  height: 56px;
  background: rgba(15, 23, 42, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 20;
  padding-bottom: 4px;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  user-select: none;
}

.tab-item.active {
  color: #38bdf8;
}

.tab-icon {
  font-size: 20px;
  position: relative;
  line-height: 1.2;
}

.tab-label {
  font-size: 11px;
  margin-top: 2px;
}

.badge-dot {
  position: absolute;
  top: -4px;
  right: -10px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  padding: 1px 5px;
  border-radius: 10px;
}

.badge-red-dot {
  position: absolute;
  top: 0;
  right: -4px;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
}

/* 主应用全局 Toast 动效 */
.global-h5-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(56, 189, 248, 0.4);
  backdrop-filter: blur(10px);
  padding: 12px 22px;
  border-radius: 24px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  z-index: 99999;
  max-width: 80%;
  text-align: center;
}

.toast-success {
  border-color: #10b981;
}

.toast-icon {
  font-weight: bold;
  font-size: 16px;
  color: #38bdf8;
}

.toast-pop-enter-active,
.toast-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-pop-enter-from,
.toast-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -40%) scale(0.9);
}

@media (max-width: 850px) {
  .desktop-wrapper {
    flex-direction: column;
    padding: 0;
    gap: 0;
  }
  .dev-sidebar {
    display: none;
  }
  .mobile-viewport {
    height: 100vh;
    max-width: 100%;
    border: none;
    border-radius: 0;
  }
  .phone-notch, .phone-home-indicator {
    display: none;
  }
}
</style>
