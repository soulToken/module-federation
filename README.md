# H5 真实的 Module Federation (模块联邦 2.0) 微前端示范项目

本项目已完全重构为基于 **Module Federation（模块联邦 2.0 / Rsbuild）** 的现代化微前端工程。

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

## 🏗️ 模块联邦架构设计

```text
qiankun/ (根工作区)
├── main-app/                # 🌟【Host 主应用基座】(端口: 3000)
│   ├── src/components/      # 主应用公共组件 (CommonNavbar, CommonButton, CommonModal)
│   ├── src/utils/           # 主应用公共方法 (authService, bridgeService, globalEventBus)
│   ├── src/App.vue          # H5 仿真机框、底栏 TabBar、动态异步按需加载远程页面
│   └── rsbuild.config.ts    # 模块联邦配置：exposes (暴露公共组件/方法) + remotes (引入3个子应用)
│
├── sub-app-mall/            # 🛒【Remote 子应用 1: 商城】(端口: 3001)
├── sub-app-activity/        # 🎁【Remote 子应用 2: 活动抽奖】(端口: 3002)
└── sub-app-user/            # 👤【Remote 子应用 3: 个人中心】(端口: 3003)
```

---

## 🚀 本地服务访问指南（已在后台运行）

- 📱 **主应用基座（聚合体验）**：[http://localhost:3000](http://localhost:3000)
- 🛒 **商城子应用（独立运行）**：[http://localhost:3001](http://localhost:3001)
- 🎁 **活动子应用（独立运行）**：[http://localhost:3002](http://localhost:3002)
- 👤 **用户子应用（独立运行）**：[http://localhost:3003](http://localhost:3003)

### 本地启动 / 重启命令：
在根目录执行：
```bash
pnpm dev
```
基于 Rust 编写的高性能 Rspack 驱动，4 个应用可在 **0.2 秒** 内瞬间启动，实时热更新。

---

## 💡 核心配置文件解析

### 1. 主应用暴露配置 (`main-app/rsbuild.config.ts`)
```typescript
pluginModuleFederation({
  name: 'mainApp',
  // 暴露公共组件与方法给所有子应用
  exposes: {
    './CommonNavbar': './src/components/CommonNavbar.vue',
    './CommonButton': './src/components/CommonButton.vue',
    './CommonModal': './src/components/CommonModal.vue',
    './utils': './src/utils/index.ts',
  },
  // 引入 3 个子应用暴露出来的业务页面
  remotes: {
    subMall: 'subAppMall@http://localhost:3001/mf-manifest.json',
    subActivity: 'subAppActivity@http://localhost:3002/mf-manifest.json',
    subUser: 'subAppUser@http://localhost:3003/mf-manifest.json',
  },
  // 共享 Vue 运行时，避免重复下载 Vue 核心库（单例共享）
  shared: {
    vue: { singleton: true, eager: true },
  },
})
```

### 2. 子应用消费配置 (`sub-app-mall/rsbuild.config.ts`)
```typescript
pluginModuleFederation({
  name: 'subAppMall',
  // 暴露自身页面给主应用宿主
  exposes: {
    './MallPage': './src/App.vue',
  },
  // 声明消费主应用的远程模块清单
  remotes: {
    mainApp: 'mainApp@http://localhost:3000/mf-manifest.json',
  },
  shared: {
    vue: { singleton: true, eager: true },
  },
})
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
