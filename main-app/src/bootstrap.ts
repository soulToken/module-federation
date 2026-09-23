import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { authService, bridgeService, globalEventBus, routeBridge } from './utils';

const app = createApp(App);
app.use(router);

(window as any).__MF_MAIN_APP__ = {
  authService,
  bridgeService,
  globalEventBus,
  routeBridge
};

const rootEl = document.getElementById('root') || document.getElementById('app');
if (rootEl) {
  app.mount(rootEl);
}
