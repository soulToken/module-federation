import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig(({ command }) => {
  const isProd = command === 'build';
  const appVersion = process.env.VITE_APP_VERSION || 'v1.1.0';
  const publicBase = process.env.VITE_APP_BASE || (isProd ? `/apps/hyper-mall/${appVersion}/` : '/');

  return {
    base: publicBase,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        '@hyper/core': path.resolve(__dirname, '../hyper-core/src'),
      },
    },
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
        name: 'hyperMall',
        filename: 'remoteEntry.js',
        manifest: true,
        dts: false,
        exposes: {
          './MallPage': './src/App.vue',
          './ProductCard': './src/components/ProductCard.vue',
        },
        remotes: {
          hyperActivity: {
            type: 'module',
            name: 'hyperActivity',
            entry: isProd ? '/apps/hyper-activity/remoteEntry.js' : 'http://localhost:3002/remoteEntry.js',
            entryGlobalName: 'hyperActivity',
            shareScope: 'default',
          },
          hyperUser: {
            type: 'module',
            name: 'hyperUser',
            entry: isProd ? '/apps/hyper-user/remoteEntry.js' : 'http://localhost:3003/remoteEntry.js',
            entryGlobalName: 'hyperUser',
            shareScope: 'default',
          },
        },
        shared: {
          vue: { singleton: true },
          'vue-router': { singleton: true },
          '@hyper/core': { singleton: true },
        },
      }),
    ],
    build: {
      target: 'chrome89',
    },
  };
});
