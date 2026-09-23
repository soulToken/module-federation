import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig({
  server: {
    port: 3000,
    cors: true,
    origin: 'http://localhost:3000',
  },
  preview: {
    port: 3000,
    cors: true,
  },
  plugins: [
    vue(),
    federation({
      name: 'mainApp',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      exposes: {
        './CommonNavbar': './src/components/CommonNavbar.vue',
        './CommonButton': './src/components/CommonButton.vue',
        './CommonModal': './src/components/CommonModal.vue',
        './utils': './src/utils/index.ts',
      },
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
      shared: {
        vue: { singleton: true },
      },
    }),
  ],
  build: {
    target: 'chrome89',
  },
});
