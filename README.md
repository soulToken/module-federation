# H5 真实的 Module Federation (模块联邦 2.0) 微前端示范项目 (Vite 全家桶)

本项目已完全迁移为基于 **Vite + @module-federation/vite (Module Federation 2.0 官方规范)** 的现代化微前端工程。

## 🎯 你的核心诉求在此项目中的纯粹实现

> **“主应用可以写一个公共的方法或者组件，可以在子组件（子应用）中使用，并且原生 import 消费。”**

在子应用中，**没有任何代理包装或黑魔法**，代码是完全原生的 ES Module 导入体验：

```vue
<script setup lang="ts">
// 🌟 1. 原生直接 import 主应用暴露的公共组件
import CommonNavbar from 'mainApp/CommonNavbar';
import CommonButton from 'mainApp/CommonButton';
import CommonModal from 'mainApp/CommonModal';

// 🌟 2. 原生直接 import 主应用暴露的公共方法与事件总线
import { authService, bridgeService, globalEventBus } from 'mainApp/utils';

// 直接使用：
const userInfo = authService.getUserInfo();
bridgeService.showToast('这是调用主应用的Toast', 'success');
</script>

<template>
  <!-- 直接像本地组件一样在模板中使用 -->
  <CommonNavbar title="商城" />
  <CommonButton type="primary" @click="handleBuy">立即购买</CommonButton>
</template>
```

---

## ✨ 系统已实现的核心功能清单 (Core Capabilities)

### 1. 模块联邦与底层基础
- **公共 UI 组件共享**：主应用向子应用暴露基础组件（`CommonNavbar`、`CommonButton`、`CommonModal`），子应用原生 ES Module `import` 消费。
- **公共工具方法共享**：主应用暴露公共服务（`authService` 统一鉴权、`bridgeService` 客户端桥接与 Toast 调起）。
- **全局事件与响应式状态**：基于 `globalEventBus` 跨应用双向通信，购物车总数、用户积分在所有微应用间实时同步。
- **公共依赖单例共享 (Singleton)**：Vue 3、Vue Router、Pinia 运行时单例共享，子应用不重复下载 Vue 核心包。
- **KeepAlive 原生保活**：Tab 切换无感缓存，不触发重复网络请求与组件重挂载。

### 2. 路由与导航体系
- **微前端混合路由架构 (Hybrid Router)**：主应用外层 Tab 切换与子应用内部深层多级路由无缝协同。
- **智能协同出栈与智能后退**：感知子应用路由栈，优先在子应用内部逐级后退，已在首页时后退直达宿主基座。
- **深链接直达 (Deep Linking)**：支持外部直接跳转深层路由（如 `/mall/detail/1`、`/user/points`）。

### 3. 多版本管理与中心化编排
- **物理多版本静态共存**：构建产物版本化存放（`/apps/<app>/<version>/remoteEntry.js`），历史版本与最新版本共存于 CDN。
- **中心化 Manifest 动态编排**：由 `version-manifest.json` 集中管控全站子应用当前生效版本与元信息。
- **运行时动态 Remote 加载**：主应用无需硬编码版本，运行时动态 `import()` 容器并注入 `__FEDERATION__` 作用域。

### 4. 生产级一键秒级回滚
- **Web UI 可视化秒级回滚**：前端面板一键点击回滚，无须刷新整页，容器实时热拔插。
- **CLI 命令行秒级回滚**：`pnpm run rollback <app> <version>`，8 秒免重构建直推边缘 CDN。
- **URL 参数调试验收**：支持携带 `?mall_ver=v1.0.0` 强制加载指定版本进行 QA 验证。

### 5. A/B 实验分流与金丝雀灰度
- **设备级确定性哈希分流**：基于访客设备 ID 进行一致性 Hash 计算（0~99 分位），同一用户多次访问永久稳定锁定，体验平滑防闪烁。
- **可视化流量切分与金丝雀灰度**：支持自定义流量权重分配（50:50、80:20、20:80、0:100 全量等）。
- **模拟新访客重新摇号**：界面提供 `🎲 重新摇号` 按钮，一秒随机生成新访客 ID 重新计算分流。
- **人工锁定分组调试**：界面提供 `锁定 A 组`、`锁定 B 组`、`恢复自然分流 (Auto)` 快速测试。
- **URL 参数定向命中**：支持携带 `?mall_ab=A` 或 `?mall_ab=B` 直达指定实验组。
- **CLI 命令行极速调控**：`pnpm run ab-test <app> <权重>`，秒级调整流量分配并推全网。
- **实时分流曝光事件流水**：前端捕获并记录每次实验曝光埋点流水。

### 6. 网关与云端部署
- **生产环境单域名统一架构**：基座与各子应用同域名同端口分发，彻底消除跨域 (Zero CORS)。
- **云原生全球边缘极速部署**：全面适配 Vercel Build Output API，构建后直接推送全球 Anycast 边缘 CDN。

---

## 🏗️ 模块联邦架构设计

```text
module-federation/ (根工作区)
├── main-app/                # 🌟【Host 主应用基座】(端口: 3000 - Vite)
│   ├── src/components/      # 主应用公共组件 (CommonNavbar, CommonButton, CommonModal)
│   ├── src/utils/           # 主应用公共方法 (authService, bridgeService, globalEventBus)
│   ├── src/App.vue          # H5 仿真机框、底栏 TabBar、动态异步按需加载远程页面
│   └── vite.config.ts       # 模块联邦配置：exposes (暴露公共组件/方法) + remotes (引入3个子应用)
│
├── sub-app-mall/            # 🛒【Remote 子应用 1: 商城】(端口: 3001 - Vite)
├── sub-app-activity/        # 🎁【Remote 子应用 2: 活动抽奖】(端口: 3002 - Vite)
└── sub-app-user/            # 👤【Remote 子应用 3: 个人中心】(端口: 3003 - Vite)
```

---

## 🚀 本地服务访问指南

- 📱 **主应用基座（聚合体验）**：[http://localhost:3000](http://localhost:3000)
- 🛒 **商城子应用（独立运行）**：[http://localhost:3001](http://localhost:3001)
- 🎁 **活动子应用（独立运行）**：[http://localhost:3002](http://localhost:3002)
- 👤 **用户子应用（独立运行）**：[http://localhost:3003](http://localhost:3003)

### 本地启动 / 重启命令：
在根目录执行：
```bash
pnpm dev
```
基于 Vite 驱动，4 个应用瞬间启动，享受 Vite 极速的开发体验与毫秒级热更新。

---

## 💡 核心配置文件解析

### 1. 主应用暴露配置 (`main-app/vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig({
  server: { port: 3000, cors: true, origin: 'http://localhost:3000' },
  plugins: [
    vue(),
    federation({
      name: 'mainApp',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      // 暴露公共组件与方法给所有子应用
      exposes: {
        './CommonNavbar': './src/components/CommonNavbar.vue',
        './CommonButton': './src/components/CommonButton.vue',
        './CommonModal': './src/components/CommonModal.vue',
        './utils': './src/utils/index.ts',
      },
      // 引入 3 个子应用暴露出来的业务页面
      remotes: {
        subMall: {
          type: 'module',
          name: 'subAppMall',
          entry: 'http://localhost:3001/remoteEntry.js',
          entryGlobalName: 'subAppMall',
          shareScope: 'default',
        },
        subActivity: {
          type: 'module',
          name: 'subAppActivity',
          entry: 'http://localhost:3002/remoteEntry.js',
          entryGlobalName: 'subAppActivity',
          shareScope: 'default',
        },
        subUser: {
          type: 'module',
          name: 'subAppUser',
          entry: 'http://localhost:3003/remoteEntry.js',
          entryGlobalName: 'subAppUser',
          shareScope: 'default',
        },
      },
      // 共享 Vue 运行时，避免重复下载 Vue 核心库（单例共享）
      shared: {
        vue: { singleton: true },
      },
    }),
  ],
});
```

### 2. 子应用消费配置 (`sub-app-mall/vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig({
  server: { port: 3001, cors: true, origin: 'http://localhost:3001' },
  plugins: [
    vue(),
    federation({
      name: 'subAppMall',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      // 暴露自身页面给主应用宿主
      exposes: {
        './MallPage': './src/App.vue',
      },
      // 声明消费主应用的远程模块清单
      remotes: {
        mainApp: {
          type: 'module',
          name: 'mainApp',
          entry: 'http://localhost:3000/remoteEntry.js',
          entryGlobalName: 'mainApp',
          shareScope: 'default',
        },
      },
      shared: {
        vue: { singleton: true },
      },
    }),
  ],
});
```

---

## 📱 移动端 H5 核心优势验证

1. **极致轻量，零额外沙箱损耗**：
   - 传统微前端需要动态 fetch HTML 并做 Proxy 拦截，在低端手机上容易掉帧。
   - 模块联邦是浏览器原生加载 chunk 的方式，完全无性能损耗。
2. **共享 Vue 运行时单例 (Singleton)**：
   - 主应用和 3 个子应用共享同一个 Vue 3 实例，子应用的构建产物只有几 KB 纯业务逻辑，极大加快 H5 首屏加载速度。
3. **原生 KeepAlive 保活**：
   - 主应用借助 Vue 原生 `<KeepAlive>` 组件缓存异步载入的远程组件，底栏切换无需重新发起网络请求，秒切不卡顿。
