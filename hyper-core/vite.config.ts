import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig(({ command }) => {
  const isProd = command === 'build';
  const appVersion = process.env.VITE_APP_VERSION || 'v1.0.0';
  const publicBase = process.env.VITE_APP_BASE || (isProd ? `/apps/hyper-core/${appVersion}/` : '/');

  return {
    base: publicBase,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
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
        name: 'hyperCore',
        filename: 'remoteEntry.js',
        manifest: true,
        dts: false,
        exposes: {
          './CommonNavbar': './src/components/CommonNavbar.vue',
          './CommonButton': './src/components/CommonButton.vue',
          './CommonModal': './src/components/CommonModal.vue',
          './HyperAsyncWidget': './src/components/HyperAsyncWidget.vue',
          './VersionControlDock': './src/components/VersionControlDock.vue',
          './utils': './src/index.ts',
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
