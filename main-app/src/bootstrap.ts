import { createApp } from 'vue';
import App from './App.vue';
import { authService, bridgeService, globalEventBus } from './utils';

const app = createApp(App);

(window as any).__MF_MAIN_APP__ = {
  authService,
  bridgeService,
  globalEventBus
};

const rootEl = document.getElementById('root') || document.getElementById('app');
if (rootEl) {
  app.mount(rootEl);
}
