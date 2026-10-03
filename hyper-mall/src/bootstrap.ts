import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';

const app = createApp(App);
app.use(router);

const rootEl = document.getElementById('root') || document.getElementById('app');
if (rootEl) {
  app.mount(rootEl);
}
