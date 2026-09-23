import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig({
  server: {
    port: 3003,
    cors: true,
    origin: 'http://localhost:3003',
  },
  preview: {
    port: 3003,
    cors: true,
  },
  plugins: [
    vue(),
    federation({
      name: 'subAppUser',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      exposes: {
        './UserPage': './src/App.vue',
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
