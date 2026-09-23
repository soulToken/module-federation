import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginVue(),
    pluginModuleFederation({
      name: 'mainApp',
      // 主应用将公共组件和公共方法暴露出去供所有子应用消费
      exposes: {
        './CommonNavbar': './src/components/CommonNavbar.vue',
        './CommonButton': './src/components/CommonButton.vue',
        './CommonModal': './src/components/CommonModal.vue',
        './utils': './src/utils/index.ts',
      },
      // 主应用作为微前端宿主，引入 3 个子应用暴露出来的业务页面
      remotes: {
        subMall: 'subAppMall@http://localhost:3001/mf-manifest.json',
        subActivity: 'subAppActivity@http://localhost:3002/mf-manifest.json',
        subUser: 'subAppUser@http://localhost:3003/mf-manifest.json',
      },
      shared: {
        vue: { singleton: true },
      },
    }),
  ],
  server: {
    port: 3000,
    cors: true,
  },
  html: {
    title: 'H5 微前端主应用基座 (Module Federation)',
    meta: {
      viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
    },
  },
});
