import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);
const rootEl = document.getElementById('root') || document.getElementById('app');
if (rootEl) {
  app.mount(rootEl);
}
