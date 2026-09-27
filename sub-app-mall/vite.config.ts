import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig(({ command }) => {
  const isProd = command === 'build';
  return {
    base: isProd ? '/apps/mall/' : '/',
    server: {
      port: 3001,
      cors: true,
      origin: 'http://localhost:3001',
    },
    preview: {
      port: 3001,
      cors: true,
    },
    plugins: [
      vue(),
      federation({
        name: 'subAppMall',
        filename: 'remoteEntry.js',
        manifest: true,
        dts: false,
        exposes: {
          './MallPage': './src/App.vue',
        },
        remotes: {
          mainApp: {
            type: 'module',
            name: 'mainApp',
            entry: isProd ? '/remoteEntry.js' : 'http://localhost:3000/remoteEntry.js',
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
  };
});
