import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig({
  server: {
    port: 3002,
    cors: true,
    origin: 'http://localhost:3002',
  },
  preview: {
    port: 3002,
    cors: true,
  },
  plugins: [
    vue(),
    federation({
      name: 'subAppActivity',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      exposes: {
        './ActivityPage': './src/App.vue',
      },
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
        'vue-router': { singleton: true },
      },
    }),
  ],
  build: {
    target: 'chrome89',
  },
});
