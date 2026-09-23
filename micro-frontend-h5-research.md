# H5 项目微前端技术调研与选型指南

> **核心目标**：在 H5（移动端 Web）项目中引入微前端架构，调研目前主流微前端方案，重点解决**主应用向子应用共享公共方法与公共组件**的诉求，并结合移动端特性给出最终选型决策与落地示例。

---

## 目录
1. [微前端在 H5 场景下的背景与挑战](#一微前端在-h5-场景下的背景与挑战)
2. [主流微前端框架深度调研与优缺点对比](#二主流微前端框架深度调研与优缺点对比)
   - 方案 1：Qiankun（基于 Single-SPA）
   - 方案 2：Wujie（无界，基于 WebComponent + Iframe）
   - 方案 3：MicroApp（基于 WebComponent）
   - 方案 4：Module Federation（模块联邦，Webpack 5 / Vite）
   - 方案 5：原生 Iframe
3. [核心诉求专项：“主应用共享组件与方法到子应用” 实现对比](#三核心诉求专项主应用共享组件与方法到子应用-实现对比)
4. [各方案多维度对比矩阵（含移动端特性评分）](#四各方案多维度对比矩阵)
5. [移动端 H5 避坑指南](#五移动端-h5-避坑指南)
6. [最终选型建议与决策树](#六最终选型建议与决策树)
7. [推荐方案落地代码示例](#七推荐方案落地代码示例)

---

## 一、微前端在 H5 场景下的背景与挑战

PC 端管理后台通常业务庞大、菜单多，且对首屏加载和内存没那么苛刻，是微前端的主要阵地。而移动端 H5 引入微前端，面临以下特殊挑战：

1. **移动端性能与网络**：移动端设备内存有限，4G/弱网环境多，主子应用若重复加载 Vue/React 等基础依赖，会导致首屏白屏时间成倍增加。
2. **移动端路由与返回键**：移动端严重依赖浏览器的历史栈（物理返回键、左滑手势返回、微信导航栏返回）。微前端多套路由管理极易出现“返回卡死”或“重复 pushState”的问题。
3. **样式隔离与移动端适配**：移动端通常依赖 `postcss-pxtorem`、`postcss-px-to-viewport`、`rem` 根字号换算。微前端若在同一个 document 下，极易造成根 font-size 污染或视口单位冲突。
4. **主应用共享组件/方法诉求**：H5 场景常有统一的登录鉴权 SDK、微信/原生 JSBridge、统一移动端 UI 组件库（如业务定制的 Toast/Modal/Navbar/ShareSheet）。主应用统一封装后，希望子应用以最低成本直接复用，而不需要各子应用独立打包一份。

---

## 二、主流微前端框架深度调研与优缺点对比

### 1. Qiankun（乾坤）

- **所属与生态**：蚂蚁集团开源，基于 `single-spa`，是国内目前知名度和生产落地案例最多的微前端框架。
- **运行原理**：通过 HTML Entry 机制动态 fetch 子应用 HTML，解析并提取 `scripts` 与 `styles`。通过 Proxy 拦截 `window`（SnapshotSandbox / ProxySandbox）实现 JS 沙箱，通过 Shadow DOM 或 Scoped CSS 实现样式隔离。

#### 优点：
- **生态成熟、文档案例极多**：几乎所有的坑都有社区现成解决方案。
- **与技术栈无关**：主子应用可以是 React、Vue、Angular、原生 JS 等任意框架组合。
- **HTML Entry 体验友好**：子应用直接提供部署后的 HTML 地址即可被主应用加载。
- **提供完备的生命周期与通信**：主子应用有 `initGlobalState`，生命周期明确（bootstrap, mount, unmount）。

#### 缺点：
- **移动端包体积与性能负担重**：沙箱机制和 dynamic eval 解析相对消耗性能，在低端 Android 手机上有一定损耗。
- **共享组件体验差**：Qiankun 设计初衷是“隔离”而非“共享”。主应用传递公共组件给子应用通常需要通过 props 传递组件引用或 render 函数，若主子应用跨框架或版本不一致，传递原生 UI 组件容易引发上下文断层或无法直接当模板标签使用。
- **移动端样式隔离易踩坑**：开启 ShadowDOM 会导致移动端很多依赖 `document.body` 挂载的弹窗组件（如 Vant/NutUI 的 Dialog、Toast）样式丢失或事件失效；开启 Scoped CSS 会存在动态添加样式未拦截的问题。
- **Keep-Alive 支持较弱**：微应用销毁后状态丢失，移动端 Tab 切换保活需要额外hack方案。

---

### 2. Wujie（无界）

- **所属与生态**：腾讯开源，专为解决 iframe 与传统微前端框架各自动作缺陷而生，是近几年增长极快的微前端框架。
- **运行原理**：**“WebComponent（UI 渲染）+ Iframe（JS 沙箱）”**。子应用的 JavaScript 运行在一个隐藏的空 iframe 中，但子应用的 DOM 节点提取后挂载在主应用的 WebComponent（Shadow DOM）中渲染。

#### 优点：
- **极致的 JS 隔离**：由于 JS 运行在原生 iframe 内部，天然具备完全的 window 隔离，无需复杂 Proxy 模拟，几乎零沙箱性能开销。
- **组件共享能力极强（重点）**：
  - 提供了 **`preload`（预加载）** 和 **`degrade`（降级）** 能力。
  - 主应用可以通过 `props` 将主应用内的**方法、响应式数据，甚至 Vue/React 组件直接传递给子应用**。
  - 子应用由于运行在 iframe 中，可以直接通过 `window.$wujie?.props` 获取主应用传递的方法和组件，甚至可以在 iframe 中访问主应用 window 对象（无同源限制时）。
- **天然支持保活（Keep-Alive）**：子应用页面切换离开时，只需要把 WebComponent 隐藏，iframe 内的 JS 状态完全保留，切回来秒开，非常契合移动端 H5 常见的“多 Tab 页面保活”体验。
- **弹窗与样式问题少**：虽然样式隔离在 Shadow DOM，但子应用的 JS 内部的 `document` 被劫持代理到了 WebComponent 容器，移动端弹窗挂载体验远优于 Qiankun。

#### 缺点：
- 腾讯官方虽然开源并维护，但版本更新频率较前期有所放缓，社区生态总体规模稍逊于 Qiankun。
- 在部分极端冷门的老旧移动端机型（iOS 10以下或远古 Android Webview）对 Web Component / Shadow DOM 兼容性需要打 polyfill。

---

### 3. MicroApp

- **所属与生态**：京东零售开源，基于 WebComponent 理念实现的轻量级类微前端方案。
- **运行原理**：直接将子应用封装为一个原生自定义标签 `<micro-app name="app" url="..."></micro-app>`，通过 Proxy 拦截 window 对象进行沙箱隔离。

#### 优点：
- **接入成本极低（类原生标签体验）**：主应用直接写 `<micro-app name="child" url="http://..."></micro-app>` 即可渲染子应用。
- **主子应用通信友好**：支持数据绑定 `data` 和全局通信 API，传递方法直观方便。
- **移动端友好**：整体架构比 Qiankun 更轻量，支持虚拟路由系统，移动端 history 返回键处理比 Qiankun 方便。

#### 缺点：
- 样式隔离机制主要是 CSS 前缀命名空间或 ShadowDOM，多层嵌套弹窗时依然需要注意样式穿透问题。
- 组件共享能力类似 Qiankun，主要通过数据总线传递或挂载全局，无法做到像模块联邦那样在代码层面实现原生 `import` 体验。

---

### 4. Module Federation（模块联邦 - Webpack 5 / Vite）

- **所属与生态**：Webpack 5 原生特性，目前 Vite 也通过 `@originjs/vite-plugin-federation` 深度支持。它本质是**代码级 / 模块级的动态跨应用加载方案**。
- **运行原理**：不同应用（容器应用与微应用）通过 Webpack 运行时清单，在浏览器端动态从远程 URL 下载暴露出来的 JS 模块（支持组件、函数、工具类、样式）。多个应用之间可以配置 `shared` 字段共享公共依赖（例如：主子应用共用同一个 Vue3/React 实例、共用 Axios、共用 Pinia）。

#### 优点：
- **组件与方法共享能力天花板（核心优势）**：
  - 子应用中可以直接像写普通模块一样：
    ```javascript
    import CommonButton from 'mainApp/CommonButton';
    import { requestWithToken, openNativeShare } from 'mainApp/utils';
    ```
  - 支持直接传参、支持 TypeScript 类型提示、具备完全的原生开发体验。
- **移动端加载速度最快、体积最小**：
  - 可以做到主子应用完全共用 `vue`、`pinia`、`vue-router` 运行时，子应用打包产物**极小**（只有几十 KB 的纯业务代码），首屏秒开。
- **无任何沙箱黑魔法与性能损耗**：
  - 纯粹的原生 ES Module / 异步 chunk 加载机制，低端手机毫无卡顿。
- **天然支持移动端路由**：
  - 整个系统本质上就像是一个统一的 SPA，路由由主应用路由统一托管，无微应用路由嵌套导致的返回键错乱问题。

#### 缺点：
- **弱沙箱隔离**：没有提供运行时的强 CSS / JS 沙箱。如果子应用写了全局污染样式的 CSS（如 `div { color: red }`），会影响主应用（需要配合 CSS Modules / TailwindCSS / Scoped CSS 规范）。
- **要求技术栈基本同构**：如果主应用是 Vue3，暴露的 Vue3 组件给子应用，子应用也必须是 Vue3（如果子应用是 React，就无法直接引用 Vue3 的 UI 组件）。

---

### 5. 原生 Iframe（带 postMessage 封装）

- **优点**：最完美的隔离，完全不需要担心任何 JS/CSS 污染，任何框架都能无缝集成。
- **缺点**：
  - 移动端灾难：Iframe 在 iOS 微信/Safari 下有严重的视口高度滚动穿透、软键盘弹起遮挡输入框等顽疾。
  - 共享组件极难：由于是完全独立的两个渲染上下文，主应用的 UI 组件无法直接在子应用 DOM 树中渲染，只能通过 postMessage 通信由主应用弹出对应浮层。
  - 内存与性能开销在移动端最高。

---

## 三、核心诉求专项：“主应用共享组件与方法到子应用” 实现对比

针对需求：**“主应用可以写一个公共的方法或者组件，可以在子组件（子应用）中使用”**，各大方案实现机制如下：

| 方案 | 共享公共方法实现 | 共享公共 UI 组件实现 | 开发与维护体验 |
| :--- | :--- | :--- | :--- |
| **Module Federation (推荐)** | 主应用 `exposes: { './utils': './src/utils' }`，子应用直接 `import { fn } from 'mainApp/utils'` | 主应用 `exposes: { './Btn': './src/components/Btn.vue' }`，子应用 `import Btn from 'mainApp/Btn'` | **极佳**（与本地开发组件库完全一致，有语法提示） |
| **Wujie (无界)** | 主应用通过 `<WujieVue :props="{ myFn }">` 传入，子应用 `window.$wujie?.props?.myFn()` | 主应用直接把组件传给子应用 props，或者子应用通过 WebComponent 自定义标签渲染 | **良好**（跨框架也能传，通过全局注入对象调用） |
| **Qiankun** | `initGlobalState` 广播或 `props` 传参，子应用在 `mount(props)` 时保存引用 | 通过 props 传递组件或 render 函数，或者打包成 NPM 库 | **较差**（代码冗余繁琐，组件更新不灵活） |
| **MicroApp** | `microApp.setData` 或 `data` 属性传递，子应用 `window.microApp.getData()` 监听 | 建议封装为 WebComponent 自定义元素通过 props 传递 | **中等**（数据通信好，但 UI 组件直接复用较别扭） |

---

## 四、各方案多维度对比矩阵

| 评估维度 (满分 5 星) | Qiankun | Wujie (无界) | MicroApp | Module Federation (模块联邦) |
| :--- | :---: | :---: | :---: | :---: |
| **移动端首屏性能与体积** | ★★★☆☆ | ★★★★☆ | ★★★★☆ | **★★★★★** |
| **公共组件/方法共享便利度** | ★★☆☆☆ | ★★★★☆ | ★★★☆☆ | **★★★★★** |
| **沙箱隔离度 (JS/CSS)** | ★★★★☆ | **★★★★★** | ★★★★☆ | ★★☆☆☆ (依赖团队代码规范) |
| **移动端多 Tab 保活 (Keep-Alive)**| ★★☆☆☆ | **★★★★★** | ★★★★☆ | ★★★★★ (直接使用 Vue/React 内置 KeepAlive) |
| **移动端路由与返回键控制** | ★★☆☆☆ | ★★★★☆ | ★★★★☆ | **★★★★★** |
| **跨不同前端框架混合开发** | **★★★★★** | **★★★★★** | ★★★★★ | ★★☆☆☆ (同框架版本最佳) |
| **侵入性与上手难度** | ★★★☆☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ |

---

## 五、移动端 H5 避坑指南

如果决定在 H5 中落地微前端，以下四个移动端核心问题必须在架构设计期预防：

1. **移动端自适应方案（vw / rem）污染**：
   - 痛点：主应用用的 `375px` 基准换算 rem，如果子应用也是 `rem`，子应用一旦修改 `document.documentElement.style.fontSize`，全站错乱。
   - 解法：**推荐全线统一采用 `postcss-px-to-viewport`（vw 方案）**，vw 是纯视口百分比，无全局状态依赖；若使用 Wujie，则子应用运行在独立样式作用域，影响较小。
2. **移动端物理返回键与路由嵌套混乱**：
   - 痛点：主应用有路由（如 `/mall`），子应用内部也有二级路由（如 `/detail`）。用户在微信内点击左上角返回或 Android 物理返回键时，经常直接退出了主应用，或者连续点两次无反应。
   - 解法：
     - 若用 **Module Federation**：子应用无需独立路由实例，直接导出页面级组件给主应用统一注册到主路由树中，彻底消灭双重路由。
     - 若用 **Wujie / MicroApp**：开启**虚拟路由模式（Virtual Route / degrade）**，子应用的路由变化不写入宿主浏览器的实际 history 栈，由主应用提供统一的“返回”按钮触发子应用内部回退。
3. **弹窗层级（z-index）与 Body 挂载溢出**：
   - 移动端遮罩层、ActionSheet、Toast 默认喜欢 append 到 `document.body`。如果沙箱不彻底或开启了错误的 ShadowDOM，弹窗可能跑出可视区或者被截断。
4. **包体积与内存膨胀**：
   - 严禁每个子应用独立把 Axios、UI 库（如 Vant/NutUI）、Vue/React 重复打进 vendor。移动端多子应用并发激活时，重复的库会导致内存飙升，低端机容易出现 Webview 进程崩溃（白屏）。

---

## 六、最终选型建议与决策树

### 🎯 明确选型建议：

根据当前微前端诉求：**“在 H5 项目中运行，并且核心目标是主应用写公共方法和公共组件，能方便地给子应用直接使用”**，给出以下结论：

### 🥇 首选推荐：Module Federation（模块联邦 - Webpack 5 / Vite）
> **推荐理由**：
> 1. **它不是单纯的应用沙箱，而是专门为“跨团队、跨项目共享模块/组件/依赖”而生的现代技术**。
> 2. 子应用可以直接通过普通的 `import` 语句，直接使用主应用的 Vue/React 组件和工具库，就像使用本地组件一样自然。
> 3. 主子应用可以共享全局基础依赖（如 Vue3、Pinia、VueRouter），移动端子应用打包后体积从数 MB 降至几十 KB，完美保证 H5 首屏加载体验。
> 4. **适用前提**：团队的主应用和子应用技术栈同构（例如主子应用均采用 Vue3 + Vite 或 React + Webpack）。绝大多数移动端 H5 团队内部技术栈都是统一的，该方案综合体验断层领先。

---

### 🥈 备选推荐（若存在技术栈异构/需要硬沙箱）：Wujie（无界）
> **推荐理由**：
> 1. 如果子应用有些是 Vue2、有些是 Vue3、有些是 React，或者子应用由第三方团队维护无法保证代码规范，需要**强制 JS/CSS 硬隔离**，此时选 **无界 (Wujie)**。
> 2. Wujie 在几大传统微前端中，对**移动端保活（KeepAlive）**和**主传子组件/方法（props 直接传递）**支持最好，iframe JS 沙箱没有性能损耗，完胜 Qiankun。

---

### 选型决策树：

```
                    ┌────────────────────────────┐
                    │    H5 项目微前端选型评估     │
                    └─────────────┬──────────────┘
                                  │
                  是否统一技术栈？(如都是 Vue3 或 React)
                                  │
                 ┌────────────────┴────────────────┐
                 ▼ 是                              ▼ 否
       主应用共享组件/方法是核心?                  需要强力沙箱隔离/不同团队不可控?
                 │                                 │
        ┌────────┴────────┐               ┌────────┴────────┐
        ▼ 是              ▼ 否            ▼ 是              ▼ 否
  【首选：模块联邦】   【Wujie/MicroApp】   【备选：Wujie】     【Qiankun】
  (Module Federation)
  * 最优移动端体积                          * 适合跨技术栈
  * 原生 import 体验                        * iframe 硬隔离
  * 零沙箱性能开销                          * 支持保活秒开
```

---

## 七、推荐方案落地代码示例

### 场景演示：
- **主应用（Host）**：提供登录 Token 校验方法 `authService`、全局分享弹窗组件 `AppShareSheet.vue`。
- **子应用（Remote）**：作为独立项目开发和部署，在自己的页面中无缝引入主应用的组件和方法。

---

### 方案 A：Module Federation（以 Vite 为例）

#### 1. 主应用 Vite 配置 (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'main_host',
      filename: 'remoteEntry.js',
      // 将公共组件和工具方法暴露出去
      exposes: {
        './AppShareSheet': './src/components/AppShareSheet.vue',
        './authUtils': './src/utils/auth.ts'
      },
      // 共享运行时依赖，避免子应用重复下载，节省移动端流量
      shared: ['vue', 'pinia', 'vant']
    })
  ],
  server: { port: 5000 }
});
```

#### 2. 子应用 Vite 配置 (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'child_app',
      // 引用主应用暴露的远程清单
      remotes: {
        main_host: 'http://h5.yourcompany.com/main/remoteEntry.js'
      },
      shared: ['vue', 'pinia', 'vant']
    })
  ]
});
```

#### 3. 子应用业务页面直接使用主应用公共组件与方法
```vue
<template>
  <div class="child-page">
    <h2>这是微应用业务页面</h2>
    <van-button type="primary" @click="handleShare">触发主应用分享</van-button>

    <!-- 直接使用主应用共享过来的通用 UI 组件 -->
    <AppShareSheet v-model:visible="showShare" :share-data="shareInfo" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// 1. 直接引用主应用的公共组件
import AppShareSheet from 'main_host/AppShareSheet';
// 2. 直接引用主应用的公共方法
import { getH5UserInfo, requestWithAuth } from 'main_host/authUtils';

const showShare = ref(false);
const shareInfo = ref({ title: '来自子应用的分享', url: window.location.href });

const handleShare = async () => {
  const user = getH5UserInfo();
  console.log('获取主应用登录态:', user);
  showShare.value = true;
};
</script>
```

---

### 方案 B：Wujie（无界）主子应用通信与组件共享示例

如果由于跨技术栈选择了 **Wujie**，实现方式如下：

#### 1. 主应用注册并向下传递公共组件和方法
```vue
<template>
  <div class="h5-container">
    <!-- Wujie 容器组件 -->
    <WujieVue
      width="100%"
      height="100%"
      name="subApp"
      url="http://sub.yourcompany.com"
      :props="sharedContext"
      :alive="true"
    />
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import GlobalToast from '@/components/GlobalToast.vue';
import { callNativeBridge } from '@/utils/bridge';

const sharedContext = {
  // 1. 传递公共方法
  callNativeBridge,
  token: 'mock_jwt_token',
  // 2. 传递公共组件引用或配置
  ToastComponent: GlobalToast
};
</script>
```

#### 2. 子应用接收并调用
```javascript
// 子应用内部的任意 JS 文件中
const props = window.$wujie?.props;

// 1. 调用主应用传入的公共方法
props?.callNativeBridge('openCamera', { quality: 80 });

console.log('当前主应用传入的 Token:', props?.token);
```

---

## 八、总结与实施步骤建议

1. **第一步（评估团队技术栈）**：
   - 如果新旧 H5 页面均基于相同技术栈（例如主流的 Vue3 + Vant / Pinia 或 React + AntdMobile），**强烈推荐选择 Module Federation**。它不仅彻底解决公共组件和方法共享的问题，而且零侵入、包体积最轻、H5 首屏性能最优。
2. **第二步（规范移动端样式与路由）**：
   - 样式适配统一采用 `viewport`（vw/vh）方案，避免使用全局根 font-size 的 rem 方案引起冲突。
   - 子应用建议采用单页无路由（或主应用通过模块联邦动态加载对应 Page），避免多层路由栈嵌套导致移动端物理返回键失效。
3. **第三步（抽离主应用 Core 共享库）**：
   - 在主应用中明确划分 `exposes` 目录，将“通用业务组件”（Navbar、ShareSheet、LoginDialog）和“核心业务工具”（Bridge、Auth、Request、Monitor）规范化导出，并提供清晰的 TypeScript 类型声明文件给各子应用仓库。
