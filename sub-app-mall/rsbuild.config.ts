import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginVue(),
    pluginModuleFederation({
      name: 'subAppMall',
      exposes: {
        './MallPage': './src/App.vue',
      },
      remotes: {
        mainApp: 'mainApp@http://localhost:3000/mf-manifest.json',
      },
      shared: {
        vue: { singleton: true },
      },
    }),
  ],
  server: {
    port: 3001,
    cors: true,
  },
  html: {
    title: '商城微应用 (Sub App Mall)',
    meta: {
      viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
    },
  },
});
